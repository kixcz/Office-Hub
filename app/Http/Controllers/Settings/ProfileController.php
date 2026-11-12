<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\InstitutionAuditLog;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Populate first/last name if not yet set
        if (empty($user->first_name) || empty($user->last_name)) {
            $parts = explode(' ', trim($user->name ?: 'User'), 2);
            $firstName = $parts[0] ?? 'User';
            $lastName = $parts[1] ?? 'Admin';
        } else {
            $firstName = $user->first_name;
            $lastName = $user->last_name;
        }

        // Get user role display
        $roles = $user->roles()->pluck('name')->toArray();
        $primaryRole = ! empty($roles) ? $roles[0] : 'System Administrator';

        // Get active college/department designation
        $college = $user->resolveActiveCollege();
        $departmentName = $user->department ?: ($college?->name ?? 'CIDS Administration');

        // Recent activity history (from audit logs / notifications or fallback)
        $activities = [];
        if (class_exists(InstitutionAuditLog::class)) {
            $activities = InstitutionAuditLog::where('user_id', $user->id)
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($log) => [
                    'id' => $log->id,
                    'action' => $log->action ?? 'System Access',
                    'description' => $log->description ?? 'Performed platform operation',
                    'ip_address' => $log->ip_address ?? '127.0.0.1',
                    'created_at' => $log->created_at?->format('M d, Y • h:i A') ?? now()->format('M d, Y • h:i A'),
                ]);
        }

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'middle_name' => $user->middle_name ?? '',
                'suffix' => $user->suffix ?? '',
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'institutional_id' => $user->institutional_id ?? 'CIDS-'.str_pad((string) $user->id, 4, '0', STR_PAD_LEFT),
                'department' => $departmentName,
                'job_title' => $user->job_title ?: $primaryRole,
                'primary_role' => $primaryRole,
                'roles' => $roles,
                'bio' => $user->bio ?? '',
                'created_at' => $user->created_at?->format('M d, Y') ?? 'Jan 15, 2024',
                'account_status' => $user->account_status ?: 'Active',
            ],
            'activities' => $activities,
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        // Compute full name if first_name / last_name provided, otherwise fallback to existing or provided name
        if (! empty($validated['first_name']) || ! empty($validated['last_name'])) {
            $firstName = $validated['first_name'] ?? '';
            $lastName = $validated['last_name'] ?? '';
            $middle = ! empty($validated['middle_name']) ? $validated['middle_name'].' ' : '';
            $suffix = ! empty($validated['suffix']) ? ' '.$validated['suffix'] : '';
            $fullName = trim("{$firstName} {$middle}{$lastName}{$suffix}");
            $validated['name'] = $fullName;
        } elseif (! empty($validated['name'])) {
            $parts = explode(' ', trim($validated['name']), 2);
            $validated['first_name'] = $parts[0] ?? $validated['name'];
            $validated['last_name'] = $parts[1] ?? '';
        }

        $user->fill($validated);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // If user has a linked Faculty profile, sync name as well
        if ($user->faculty) {
            $user->faculty->update([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'suffix' => $validated['suffix'] ?? null,
                'email' => $validated['email'],
                'phone_number' => $validated['phone'] ?? $user->faculty->phone_number,
            ]);
        }

        return to_route('profile.edit')->with('success', 'Profile information updated successfully.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
