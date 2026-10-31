<?php

namespace App\Http\Middleware;

use App\Models\AcademicPeriod;
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
        if ($user) {
            $user->loadMissing(['roles', 'faculty.program']);
        }

        return array_merge(parent::share($request), [
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'roles' => $user->roles->pluck('name'),
                    'is_faculty' => $user->isFaculty(),
                    'is_college_admin' => $user->isCollegeAdmin(),
                    'is_institution_super_admin' => $user->isInstitutionSuperAdmin(),
                    'is_vpaf' => $user->isVpaf(),
                    'can_switch_channels' => $user->canSwitchTvChannels(),
                    'faculty' => $user->faculty,
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
