<?php

namespace App\Http\Middleware;

use App\Services\PortalContextService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceActiveRoleContext
{
    public function __construct(protected PortalContextService $portalService) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Guest requests pass through to auth middleware
        if (! $user) {
            return $next($request);
        }

        // Initialize active portal assignment context
        $active = $this->portalService->getActiveAssignment($user, $request);
        $path = $request->path();

        // 1. Enforce VPAF Routes isolation
        if (str_starts_with($path, 'vpaf')) {
            if ($active['portal_type'] !== 'vpaf') {
                abort(403, "Access Denied. Your active workspace context is '{$active['display_label']}'. To access executive oversight, please switch to the VPAF Executive portal using the header switcher.");
            }
        }

        // 2. Enforce Institution Super Admin Routes isolation
        if (str_starts_with($path, 'institution')) {
            if ($active['portal_type'] !== 'institution_super_admin') {
                abort(403, "Access Denied. Your active workspace context is '{$active['display_label']}'. To access central governance, please switch to the Institution Super Admin portal using the header switcher.");
            }
        }

        // 3. Enforce Faculty Portal isolation
        if (str_starts_with($path, 'faculty')) {
            if ($active['portal_type'] !== 'faculty') {
                // If the user has a faculty assignment, instruct them to switch
                $available = $this->portalService->getUserAvailableAssignments($user);
                $hasFaculty = $available->contains('portal_type', 'faculty');

                if ($hasFaculty) {
                    abort(403, "Access Denied. Your active workspace context is '{$active['display_label']}'. To access your personal faculty classes and submissions, please switch to your Faculty workspace using the header switcher.");
                } else {
                    abort(403, 'Access Denied. You do not have an active Faculty Member assignment.');
                }
            }
        }

        $request->attributes->set('active_portal_context', $active);

        return $next($request);
    }
}
