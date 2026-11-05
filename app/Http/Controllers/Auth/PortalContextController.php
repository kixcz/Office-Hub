<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\PortalContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortalContextController extends Controller
{
    public function __construct(protected PortalContextService $portalService) {}

    /**
     * Switch user's active portal and security scope.
     */
    public function switch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'scoped_role_assignment_id' => 'required|integer',
        ]);

        $user = $request->user();
        if (! $user) {
            return redirect()->route('login');
        }

        try {
            $target = $this->portalService->switchContext(
                $user,
                (int) $validated['scoped_role_assignment_id'],
                $request
            );

            return redirect($target['landing_url'])->with(
                'success',
                "Active workspace switched to {$target['display_label']}."
            );
        } catch (\InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Set a designated default portal for the user.
     */
    public function setDefault(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'scoped_role_assignment_id' => 'required|integer',
        ]);

        $user = $request->user();
        if (! $user) {
            return redirect()->route('login');
        }

        $available = $this->portalService->getUserAvailableAssignments($user);
        $target = $available->firstWhere('id', (int) $validated['scoped_role_assignment_id']);

        if (! $target) {
            return back()->with('error', 'Selected assignment does not belong to you.');
        }

        $user->update([
            'default_role_assignment_id' => $target['id'],
        ]);

        return back()->with(
            'success',
            "Default portal set to {$target['display_label']}."
        );
    }

    /**
     * Display the Choose Workspace view for multi-role users upon login.
     */
    public function chooseWorkspace(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        if (! $user) {
            return redirect()->route('login');
        }

        $available = $this->portalService->getUserAvailableAssignments($user);

        if ($available->count() <= 1) {
            $first = $available->first();

            return redirect($first ? $first['landing_url'] : '/dashboard');
        }

        return Inertia::render('auth/choose-workspace', [
            'availablePortals' => $available,
            'defaultPortalId' => $user->default_role_assignment_id,
        ]);
    }
}
