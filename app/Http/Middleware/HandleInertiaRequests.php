<?php

namespace App\Http\Middleware;

use App\Models\AcademicPeriod;
use App\Models\College;
use App\Models\Program;
use App\Services\PortalContextService;
use App\Services\ScopeBrandingService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();
        $activeCollege = null;
        $portalContext = null;
        $activeBranding = null;

        if ($user) {
            $user->loadMissing(['roles', 'faculty.program.college']);

            $portalService = app(PortalContextService::class);
            $activeAssignment = $portalService->getActiveAssignment($user, $request);
            $availableAssignments = $portalService->getUserAvailableAssignments($user);

            // Determine active college scope from active assignment or user profile
            $activePortalType = $activeAssignment['portal_type'] ?? null;
            $activeScopeType = strtolower($activeAssignment['scope_type'] ?? '');
            $activeScopeCollegeId = ($activeScopeType === 'college' || $activeScopeType === 'program') ? $activeAssignment['scope_id'] : null;
            $activeScopeEntityId = $activeScopeType === 'entity' ? $activeAssignment['scope_id'] : null;

            // If scope is Program, resolve the parent College
            if ($activeScopeType === 'program' && $activeScopeCollegeId) {
                $programModel = Program::find($activeScopeCollegeId);
                $activeScopeCollegeId = $programModel?->college_id;
            }

            if ($activeScopeCollegeId) {
                $activeCollege = College::find($activeScopeCollegeId);
            } elseif ($activePortalType !== 'institution_super_admin' && $activePortalType !== 'vpaa' && $activePortalType !== 'vpaf') {
                $activeCollege = $user->resolveActiveCollege();
                $activeScopeCollegeId = $activeCollege?->id;
            }

            // Resolve hierarchical visual branding: Institution -> Entity -> College -> Active Scope
            $brandingService = app(ScopeBrandingService::class);
            $activeBranding = $brandingService->resolveActiveBranding(
                portalType: $activePortalType,
                collegeId: $activeScopeCollegeId,
                entityId: $activeScopeEntityId
            );

            $portalContext = [
                'active_assignment' => $activeAssignment,
                'available_assignments' => $availableAssignments->values()->all(),
                'can_switch_portal' => $availableAssignments->count() > 1,
            ];
        } else {
            $brandingService = app(ScopeBrandingService::class);
            $activeBranding = $brandingService->resolveActiveBranding();
        }

        return array_merge(parent::share($request), [
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'portal_context' => $portalContext,
            'active_branding' => $activeBranding,
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'roles' => $user->roles->pluck('name'),
                    'is_faculty' => $user->isFaculty(),
                    'is_college_admin' => $user->isCollegeAdmin(),
                    'is_institution_super_admin' => $user->isInstitutionSuperAdmin(),
                    'is_vpaa' => $user->isVpaa(),
                    'is_vpaf' => $user->isVpaf(),
                    'can_switch_channels' => $user->canSwitchTvChannels(),
                    'faculty' => $user->faculty,
                    'active_college' => $activeCollege ? [
                        'id' => $activeCollege->id,
                        'code' => $activeCollege->code,
                        'name' => $activeCollege->name,
                        'acronym' => $activeCollege->acronym ?: $activeCollege->code,
                        'dean_name' => $activeCollege->dean_name,
                        'contact_email' => $activeCollege->contact_email,
                        'logo_url' => $activeCollege->logo_url,
                        'color_theme' => $activeCollege->color_theme,
                        'branding' => $activeCollege->branding,
                    ] : null,
                ]) : null,
            ],
            'currentAcademicPeriod' => fn () => AcademicPeriod::current(),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}
