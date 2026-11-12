<?php

namespace App\Services;

use App\Models\College;
use App\Models\InstitutionSetting;

class ScopeBrandingService
{
    /**
     * Default Institution Fallback Branding Specification
     */
    public const INSTITUTION_DEFAULTS = [
        'scope_type' => 'institution',
        'scope_id' => null,
        'scope_code' => 'DSSC',
        'scope_name' => 'Davao Del Sur State College',
        'short_name' => 'DSSC',
        'tagline' => 'Excellence, Integrity, and Innovation in Academic Governance.',
        'logo_url' => '/Ascend.png',
        'favicon_url' => '/Ascend.png',
        'wordmark' => 'Ascend Governance',
        'primary_color' => '#0B3A67',
        'primary_color_vivid' => '#0B3A67',
        'secondary_color' => '#1F5D9B',
        'accent_color' => '#8B1E3F',
        'surface_color' => '#FFFFFF',
        'dark_color' => '#68152E',
        'preset_key' => 'blue',
        'header_style' => 'light',
        'sidebar_style' => 'light',
        'report_header' => 'Republic of the Philippines · DAVAO DEL SUR STATE COLLEGE',
        'report_footer' => 'ISO 9001:2015 Certified · Generated via Ascend Academic & Governance Platform',
        'tv_theme' => 'dark_glass',
        'is_inherited' => false,
        'inherited_from' => 'institution',
    ];

    /**
     * System semantic status colors that are locked by Institution Super Admin
     * and NEVER overridden by College or Entity brand colors.
     */
    public const SEMANTIC_STATUS_COLORS = [
        'success' => '#10B981',      // Emerald 500
        'success_bg' => '#ECFDF5',   // Emerald 50
        'warning' => '#F59E0B',      // Amber 500
        'warning_bg' => '#FFFBEB',   // Amber 50
        'error' => '#EF4444',        // Rose 500
        'error_bg' => '#FEF2F2',     // Rose 50
        'info' => '#3B82F6',         // Blue 500
        'info_bg' => '#EFF6FF',      // Blue 50
        'neutral' => '#64748B',      // Slate 500
    ];

    /**
     * Resolve the active visual identity according to the inheritance hierarchy:
     * Institution Default -> Entity/Campus Override -> College Override -> Active Scope
     *
     * @param  string|null  $portalType  E.g. 'institution_super_admin', 'vpaf', 'college_admin', 'faculty', 'dean', 'program_head'
     * @param  int|null  $collegeId  Specific College scope id if known
     * @param  int|null  $entityId  Specific Entity/Campus scope id if known
     */
    public function resolveActiveBranding(?string $portalType = null, ?int $collegeId = null, ?int $entityId = null): array
    {
        $institutionBranding = $this->getInstitutionBranding();

        // 1. If active portal is purely Institutional (e.g. Institution Super Admin, VPAA, VPAF), return Institution Branding
        if (in_array($portalType, ['institution_super_admin', 'vpaa', 'vpaf'], true) && ! $collegeId) {
            return array_merge($institutionBranding, [
                'resolved_level' => 'institution',
                'semantic_colors' => self::SEMANTIC_STATUS_COLORS,
                'css_variables' => $this->generateCssVariables($institutionBranding),
            ]);
        }

        // 2. If a College is in scope, load College and resolve inheritance:
        // Institution -> Entity (Parent) -> College
        if ($collegeId) {
            $college = College::with('parent')->find($collegeId);
            if ($college) {
                return $this->resolveCollegeBranding($college, $institutionBranding);
            }
        }

        // 3. If an Entity/Campus is in scope (e.g. Entity Admin):
        if ($entityId) {
            $entity = College::find($entityId);
            if ($entity) {
                return $this->resolveEntityBranding($entity, $institutionBranding);
            }
        }

        // Fallback: Default to Institution visual identity
        return array_merge($institutionBranding, [
            'resolved_level' => 'institution',
            'semantic_colors' => self::SEMANTIC_STATUS_COLORS,
            'css_variables' => $this->generateCssVariables($institutionBranding),
        ]);
    }

    /**
     * Resolve branding for a College, inheriting from Entity parent or Institution
     */
    public function resolveCollegeBranding(College $college, ?array $institutionBranding = null): array
    {
        $institution = $institutionBranding ?? $this->getInstitutionBranding();
        $parentEntity = $college->parent_id ? College::find($college->parent_id) : null;
        $entityBranding = $parentEntity ? $this->extractModelBranding($parentEntity) : null;

        $collegeRaw = $this->extractModelBranding($college);

        // Fallback order: College explicit value -> Entity parent value -> Institution default
        $primaryColor = $collegeRaw['primary_color']
            ?? $entityBranding['primary_color']
            ?? $institution['primary_color'];

        $secondaryColor = $collegeRaw['secondary_color']
            ?? $entityBranding['secondary_color']
            ?? $institution['secondary_color'];

        $accentColor = $collegeRaw['accent_color']
            ?? $entityBranding['accent_color']
            ?? $institution['accent_color'];

        $surfaceColor = $collegeRaw['surface_color']
            ?? $entityBranding['surface_color']
            ?? $institution['surface_color'];

        $logoUrl = $collegeRaw['logo_url']
            ?? $entityBranding['logo_url']
            ?? $institution['logo_url'];

        $slogan = $collegeRaw['tagline']
            ?? $entityBranding['tagline']
            ?? $institution['tagline'];

        $inheritedFrom = 'institution';
        if (! empty($collegeRaw['primary_color']) || ! empty($collegeRaw['logo_url'])) {
            $inheritedFrom = 'college';
        } elseif ($entityBranding && (! empty($entityBranding['primary_color']) || ! empty($entityBranding['logo_url']))) {
            $inheritedFrom = 'entity';
        }

        $resolved = [
            'scope_type' => 'college',
            'scope_id' => $college->id,
            'scope_code' => $college->code,
            'scope_name' => $college->name,
            'short_name' => $college->acronym ?: $college->code,
            'tagline' => $slogan,
            'logo_url' => $logoUrl ?: '/Ascend.png',
            'institution_logo_url' => $institution['logo_url'] ?? '/Ascend.png',
            'institution_name' => $institution['scope_name'] ?? 'Davao Del Sur State College',
            'favicon_url' => $collegeRaw['favicon_url'] ?? $logoUrl ?? $institution['favicon_url'] ?? '/Ascend.png',
            'wordmark' => $college->code,
            'primary_color' => $primaryColor,
            'primary_color_vivid' => $primaryColor,
            'secondary_color' => $secondaryColor,
            'accent_color' => $accentColor,
            'surface_color' => $surfaceColor,
            'dark_color' => $collegeRaw['dark_color'] ?? $institution['dark_color'],
            'preset_key' => $collegeRaw['preset_key'] ?? $college->color_theme ?? 'custom',
            'header_style' => $collegeRaw['header_style'] ?? 'light',
            'sidebar_style' => $collegeRaw['sidebar_style'] ?? 'light',
            'report_header' => $collegeRaw['report_header'] ?? "{$college->name} ({$college->code})",
            'report_footer' => $collegeRaw['report_footer'] ?? $institution['report_footer'],
            'tv_theme' => $collegeRaw['tv_theme'] ?? 'college_glass',
            'is_inherited' => $inheritedFrom !== 'college',
            'inherited_from' => $inheritedFrom,
            'resolved_level' => 'college',
            'semantic_colors' => self::SEMANTIC_STATUS_COLORS,
        ];

        $resolved['css_variables'] = $this->generateCssVariables($resolved);

        return $resolved;
    }

    /**
     * Resolve branding for an Entity / Campus
     */
    public function resolveEntityBranding(College $entity, ?array $institutionBranding = null): array
    {
        $institution = $institutionBranding ?? $this->getInstitutionBranding();
        $entityRaw = $this->extractModelBranding($entity);

        $primaryColor = $entityRaw['primary_color'] ?? $institution['primary_color'];
        $secondaryColor = $entityRaw['secondary_color'] ?? $institution['secondary_color'];
        $accentColor = $entityRaw['accent_color'] ?? $institution['accent_color'];
        $logoUrl = $entityRaw['logo_url'] ?? $institution['logo_url'];

        $resolved = [
            'scope_type' => 'entity',
            'scope_id' => $entity->id,
            'scope_code' => $entity->code,
            'scope_name' => $entity->name,
            'short_name' => $entity->acronym ?: $entity->code,
            'tagline' => $entityRaw['tagline'] ?? $institution['tagline'],
            'logo_url' => $logoUrl ?: $institution['logo_url'],
            'favicon_url' => $entityRaw['favicon_url'] ?? $logoUrl ?? $institution['favicon_url'],
            'wordmark' => $entity->code,
            'primary_color' => $primaryColor,
            'primary_color_vivid' => $primaryColor,
            'secondary_color' => $secondaryColor,
            'accent_color' => $accentColor,
            'surface_color' => $entityRaw['surface_color'] ?? $institution['surface_color'],
            'dark_color' => $entityRaw['dark_color'] ?? $institution['dark_color'],
            'preset_key' => $entityRaw['preset_key'] ?? 'entity',
            'header_style' => $entityRaw['header_style'] ?? 'light',
            'sidebar_style' => $entityRaw['sidebar_style'] ?? 'light',
            'report_header' => $entityRaw['report_header'] ?? "{$entity->name} Campus",
            'report_footer' => $entityRaw['report_footer'] ?? $institution['report_footer'],
            'tv_theme' => $entityRaw['tv_theme'] ?? 'entity_glass',
            'is_inherited' => empty($entityRaw['primary_color']) && empty($entityRaw['logo_url']),
            'inherited_from' => 'institution',
            'resolved_level' => 'entity',
            'semantic_colors' => self::SEMANTIC_STATUS_COLORS,
        ];

        $resolved['css_variables'] = $this->generateCssVariables($resolved);

        return $resolved;
    }

    /**
     * Get baseline Institution Branding from InstitutionSetting or defaults
     */
    public function getInstitutionBranding(): array
    {
        $name = InstitutionSetting::getVal('institution_name', self::INSTITUTION_DEFAULTS['scope_name']);
        $acronym = InstitutionSetting::getVal('institution_acronym', self::INSTITUTION_DEFAULTS['short_name']);
        $logoUrl = InstitutionSetting::getVal('institution_logo_url', self::INSTITUTION_DEFAULTS['logo_url']);
        $reportHeader = InstitutionSetting::getVal('institution_report_header', self::INSTITUTION_DEFAULTS['report_header']);
        $reportFooter = InstitutionSetting::getVal('institution_report_footer', self::INSTITUTION_DEFAULTS['report_footer']);

        $customBranding = InstitutionSetting::getVal('institution_branding_config', []);

        return array_merge(self::INSTITUTION_DEFAULTS, [
            'scope_name' => $name,
            'short_name' => $acronym,
            'scope_code' => $acronym,
            'logo_url' => $logoUrl ?: self::INSTITUTION_DEFAULTS['logo_url'],
            'report_header' => $reportHeader,
            'report_footer' => $reportFooter,
        ], is_array($customBranding) ? $customBranding : []);
    }

    /**
     * Helper to extract branding array from a College / Entity model
     */
    protected function extractModelBranding(College $model): array
    {
        $reportDefaults = is_array($model->report_defaults) ? $model->report_defaults : [];
        $branding = $reportDefaults['branding'] ?? [];

        return [
            'primary_color' => $branding['primary_color'] ?? null,
            'secondary_color' => $branding['secondary_color'] ?? null,
            'accent_color' => $branding['accent_color'] ?? null,
            'surface_color' => $branding['surface_color'] ?? null,
            'dark_color' => $branding['dark_color'] ?? null,
            'preset_key' => $branding['preset_key'] ?? $model->color_theme ?? null,
            'tagline' => $branding['slogan'] ?? null,
            'logo_url' => $model->logo_url ?? $branding['logo_url'] ?? null,
            'favicon_url' => $branding['favicon_url'] ?? null,
            'header_style' => $branding['header_style'] ?? null,
            'sidebar_style' => $branding['sidebar_style'] ?? null,
            'report_header' => $branding['report_header'] ?? null,
            'report_footer' => $branding['report_footer'] ?? null,
            'tv_theme' => $branding['tv_theme'] ?? null,
        ];
    }

    /**
     * Compute a readable high-contrast foreground color (either #FFFFFF or #0F172A)
     * based on the W3C luminance of a hex color.
     */
    protected function computeContrastForeground(?string $hexColor): string
    {
        if (! $hexColor) {
            return '#FFFFFF';
        }

        $hex = ltrim($hexColor, '#');
        if (strlen($hex) === 3) {
            $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
        }

        if (strlen($hex) !== 6) {
            return '#FFFFFF';
        }

        $r = hexdec(substr($hex, 0, 2)) / 255;
        $g = hexdec(substr($hex, 2, 2)) / 255;
        $b = hexdec(substr($hex, 4, 2)) / 255;

        // Relative luminance
        $luminance = 0.2126 * $r + 0.7152 * $g + 0.0722 * $b;

        // Light background -> dark text; Dark background -> white text
        return $luminance > 0.45 ? '#0F172A' : '#FFFFFF';
    }

    /**
     * Create a subtle, accessible background tint from a hex color.
     */
    protected function createTint(string $hexColor, float $opacity = 0.12): string
    {
        $hex = ltrim($hexColor, '#');
        if (strlen($hex) === 3) {
            $hex = $hex[0].$hex[0].$hex[1].$hex[1].$hex[2].$hex[2];
        }

        if (strlen($hex) !== 6) {
            return 'rgba(76, 29, 149, 0.12)';
        }

        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));

        return sprintf('rgba(%d, %d, %d, %.2f)', $r, $g, $b, $opacity);
    }

    /**
     * Generate standard CSS variables map from a resolved branding array
     */
    public function generateCssVariables(array $branding): array
    {
        $colors = $branding['colors'] ?? [];
        $primary = $branding['primary_color'] ?? $colors['primary'] ?? '#4f46e5';
        $secondary = $branding['secondary_color'] ?? $colors['secondary'] ?? '#4338ca';
        $accent = $branding['accent_color'] ?? $colors['accent'] ?? '#f59e0b';
        $surface = $branding['surface_color'] ?? $colors['surface'] ?? '#FFFFFF';
        $dark = $branding['dark_color'] ?? $colors['dark'] ?? '#17152E';

        $primaryFg = $this->computeContrastForeground($primary);
        $secondaryFg = $this->computeContrastForeground($secondary);
        $accentFg = $this->computeContrastForeground($accent);
        $surfaceFg = $this->computeContrastForeground($surface);

        // Dynamic sidebar interactive tokens derived from primary brand color
        $sidebarActive = $primary;
        $sidebarActiveFg = $primaryFg;
        $sidebarHover = $this->createTint($primary, 0.12);
        // If primary is light (e.g. gold/yellow), hover foreground should be high-contrast dark;
        // if primary is dark, hover foreground uses primary color for rich accent
        $primaryLum = $this->computeContrastForeground($primary) === '#0F172A' ? 'light' : 'dark';
        $sidebarHoverFg = $primaryLum === 'light' ? '#0F172A' : $primary;

        return [
            '--brand-primary' => $primary,
            '--brand-primary-vivid' => $branding['primary_color_vivid'] ?? $primary,
            '--brand-secondary' => $secondary,
            '--brand-accent' => $accent,
            '--brand-surface' => $surface,
            '--brand-dark' => $dark,
            // Semantic status colors are strictly protected
            '--brand-success' => self::SEMANTIC_STATUS_COLORS['success'],
            '--brand-warning' => self::SEMANTIC_STATUS_COLORS['warning'],
            '--brand-danger' => self::SEMANTIC_STATUS_COLORS['error'],
            '--brand-error' => self::SEMANTIC_STATUS_COLORS['error'],
            '--brand-info' => self::SEMANTIC_STATUS_COLORS['info'],
            '--primary' => $primary,
            '--primary-foreground' => $primaryFg,
            '--secondary' => $secondary,
            '--secondary-foreground' => $secondaryFg,
            '--accent' => $accent,
            '--accent-foreground' => $accentFg,
            '--ring' => $primary,
            '--sidebar-primary' => $primary,
            '--sidebar-primary-foreground' => $primaryFg,
            '--sidebar-accent' => $accent,
            '--sidebar-accent-foreground' => $accentFg,
            // Dynamic workspace sidebar navigation tokens
            '--sidebar-active' => $sidebarActive,
            '--sidebar-active-fg' => $sidebarActiveFg,
            '--sidebar-hover' => $sidebarHover,
            '--sidebar-hover-fg' => $sidebarHoverFg,
            // Backwards compatibility with previous college-* aliases
            '--college-primary' => $primary,
            '--college-secondary' => $secondary,
            '--college-accent' => $accent,
            '--college-surface' => $surface,
        ];
    }
}
