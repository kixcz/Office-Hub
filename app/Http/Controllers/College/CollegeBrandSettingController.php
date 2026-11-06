<?php

namespace App\Http\Controllers\College;

use App\Http\Controllers\Controller;
use App\Models\College;
use App\Models\InstitutionAuditLog;
use App\Models\User;
use App\Services\PortalContextService;
use App\Services\ScopeBrandingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CollegeBrandSettingController extends Controller
{
    public function __construct(
        protected PortalContextService $portalService,
        protected ScopeBrandingService $brandingService
    ) {}

    /**
     * Show College Brand & Theme Settings workspace
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user, 401);

        // Resolve which college this user can administer
        $college = $this->resolveAdminCollege($user, $request);
        if (! $college) {
            abort(403, 'Unauthorized. You do not have College Admin or Dean authority for an active college.');
        }

        $college->load('parent');

        // Resolve active branding through inheritance: Institution -> Entity -> College
        $activeBranding = $this->brandingService->resolveCollegeBranding($college);
        $institutionBranding = $this->brandingService->getInstitutionBranding();
        $parentEntityBranding = $college->parent ? $this->brandingService->resolveEntityBranding($college->parent) : null;

        return Inertia::render('college/settings/branding', [
            'college' => [
                'id' => $college->id,
                'name' => $college->name,
                'code' => $college->code,
                'acronym' => $college->acronym ?: $college->code,
                'dean_name' => $college->dean_name,
                'contact_email' => $college->contact_email,
                'logo_url' => $college->logo_url,
                'color_theme' => $college->color_theme,
                'report_defaults' => $college->report_defaults,
                'branding' => $activeBranding,
                'parent' => $college->parent ? [
                    'id' => $college->parent->id,
                    'code' => $college->parent->code,
                    'name' => $college->parent->name,
                ] : null,
            ],
            'institutionBranding' => $institutionBranding,
            'parentEntityBranding' => $parentEntityBranding,
            'semanticColors' => ScopeBrandingService::SEMANTIC_STATUS_COLORS,
        ]);
    }

    /**
     * Update College Brand & Theme Configuration
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $college = $this->resolveAdminCollege($user, $request);
        if (! $college) {
            abort(403, 'Unauthorized to configure this college.');
        }

        $validated = $request->validate([
            'primary_color' => 'required|string|regex:/^#([A-Fa-f0-9]{6})$/',
            'secondary_color' => 'required|string|regex:/^#([A-Fa-f0-9]{6})$/',
            'accent_color' => 'required|string|regex:/^#([A-Fa-f0-9]{6})$/',
            'surface_color' => 'nullable|string|regex:/^#([A-Fa-f0-9]{6})$/',
            'dark_color' => 'nullable|string|regex:/^#([A-Fa-f0-9]{6})$/',
            'preset_key' => 'nullable|string|max:50',
            'slogan' => 'nullable|string|max:255',
            'short_name' => 'nullable|string|max:50',
            'header_style' => 'nullable|string|in:light,primary,dark,glass',
            'sidebar_style' => 'nullable|string|in:light,colored_active,dark,accent',
            'report_header' => 'nullable|string|max:255',
            'report_footer' => 'nullable|string|max:255',
            'tv_theme' => 'nullable|string|max:50',
            'logo' => 'nullable|image|mimes:png,jpg,jpeg,webp,svg|max:4096',
            'remove_logo' => 'nullable|boolean',
            'favicon' => 'nullable|image|mimes:png,ico,svg|max:2048',
        ]);

        $reportDefaults = is_array($college->report_defaults) ? $college->report_defaults : [];
        $currentBranding = $reportDefaults['branding'] ?? [];

        // Handle College Logo Upload or Removal
        $logoUrl = $college->logo_url;
        if ($request->boolean('remove_logo')) {
            $logoUrl = null;
        } elseif ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $safeCode = strtolower(preg_replace('/[^a-zA-Z0-9_-]/', '', $college->code));
            $filename = "college_{$safeCode}_".time().'.'.$file->getClientOriginalExtension();
            $uploadDir = public_path('uploads/colleges');
            if (! is_dir($uploadDir)) {
                @mkdir($uploadDir, 0755, true);
            }
            $file->move($uploadDir, $filename);
            $logoUrl = '/uploads/colleges/'.$filename;
        }

        // Handle Favicon Upload
        $faviconUrl = $currentBranding['favicon_url'] ?? null;
        if ($request->hasFile('favicon')) {
            $file = $request->file('favicon');
            $safeCode = strtolower(preg_replace('/[^a-zA-Z0-9_-]/', '', $college->code));
            $filename = "fav_{$safeCode}_".time().'.'.$file->getClientOriginalExtension();
            $uploadDir = public_path('uploads/colleges');
            if (! is_dir($uploadDir)) {
                @mkdir($uploadDir, 0755, true);
            }
            $file->move($uploadDir, $filename);
            $faviconUrl = '/uploads/colleges/'.$filename;
        }

        $newBranding = [
            'primary_color' => $validated['primary_color'],
            'secondary_color' => $validated['secondary_color'],
            'accent_color' => $validated['accent_color'],
            'surface_color' => $validated['surface_color'] ?? '#FFFFFF',
            'dark_color' => $validated['dark_color'] ?? '#17152E',
            'preset_key' => $validated['preset_key'] ?? 'custom',
            'slogan' => $validated['slogan'] ?? '',
            'short_name' => $validated['short_name'] ?? $college->code,
            'header_style' => $validated['header_style'] ?? 'light',
            'sidebar_style' => $validated['sidebar_style'] ?? 'colored_active',
            'report_header' => $validated['report_header'] ?? "{$college->name} ({$college->code})",
            'report_footer' => $validated['report_footer'] ?? 'ISO 9001:2015 Certified · Generated via Ascend Platform',
            'tv_theme' => $validated['tv_theme'] ?? 'college_glass',
            'logo_url' => $logoUrl,
            'favicon_url' => $faviconUrl,
        ];

        $reportDefaults['branding'] = $newBranding;

        $college->update([
            'logo_url' => $logoUrl,
            'color_theme' => $validated['preset_key'] ?? 'custom',
            'report_defaults' => $reportDefaults,
            'acronym' => $validated['short_name'] ?? $college->acronym,
        ]);

        InstitutionAuditLog::record(
            module: 'College Branding',
            action: 'Updated College Visual Identity',
            targetName: "{$college->name} ({$college->code})",
            actor: $user,
            previousValue: $currentBranding,
            newValue: $newBranding,
            reason: 'College brand colors, logo, and theme updated by College Administrator.',
            severity: 'info',
            collegeScope: $college->code,
            targetType: 'College'
        );

        return back()->with('success', "Visual identity and theme saved for {$college->code}.");
    }

    /**
     * Reset College Branding to Inherit from Institution / Entity Default
     */
    public function reset(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $college = $this->resolveAdminCollege($user, $request);
        if (! $college) {
            abort(403, 'Unauthorized.');
        }

        $reportDefaults = is_array($college->report_defaults) ? $college->report_defaults : [];
        unset($reportDefaults['branding']);

        $college->update([
            'color_theme' => 'indigo',
            'report_defaults' => $reportDefaults,
        ]);

        InstitutionAuditLog::record(
            module: 'College Branding',
            action: 'Reset College Branding to Default',
            targetName: "{$college->name} ({$college->code})",
            actor: $user,
            previousValue: null,
            newValue: null,
            reason: 'College branding reset to inherit institutional platform defaults.',
            severity: 'info',
            collegeScope: $college->code,
            targetType: 'College'
        );

        return back()->with('success', "{$college->code} branding reset to institutional defaults.");
    }

    /**
     * Helper to resolve the active college the user is authorized to manage
     */
    protected function resolveAdminCollege(User $user, Request $request): ?College
    {
        // 1. If Super Admin, allow querying any college via ?college_id=
        if ($user->isInstitutionSuperAdmin()) {
            $reqId = $request->query('college_id');
            if ($reqId) {
                return College::find($reqId);
            }
        }

        // 2. Active scoped assignment with college scope
        $activeAssignment = $this->portalService->getActiveAssignment($user, $request);
        if (($activeAssignment['scope_type'] ?? null) === 'college' && ! empty($activeAssignment['scope_id'])) {
            return College::find($activeAssignment['scope_id']);
        }

        // 3. Fallback to user's assigned active college
        return $user->resolveActiveCollege();
    }
}
