<?php

namespace App\Http\Controllers;

use App\Services\PortalContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Handle the home route (`/`).
     * If the user is authenticated, direct them to their active workspace overview / dashboard.
     * If the user is unauthenticated (guest), render the login page.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return Inertia::render('auth/login');
        }

        if ($user->hasRole('Display Screen') || $user->hasRole('tv_display') || $user->email === 'tv@cids.edu.ph') {
            return redirect()->route('tv-display');
        }

        $portalService = app(PortalContextService::class);
        $available = $portalService->getUserAvailableAssignments($user);

        // If user has an explicit default portal set, activate it and open directly
        if ($user->default_role_assignment_id) {
            $default = $available->firstWhere('id', $user->default_role_assignment_id);
            if ($default) {
                $portalService->switchContext($user, $default['id'], $request);

                return redirect()->to($default['landing_url']);
            }
        }

        // If user has multiple roles and no designated default, direct to Choose Workspace
        if ($available->count() > 1 && ! $user->default_role_assignment_id && ! session('active_role_assignment_id')) {
            return redirect()->route('context.choose-workspace');
        }

        $active = $portalService->getActiveAssignment($user, $request);

        return redirect()->to($active['landing_url'] ?? '/dashboard');
    }
}
