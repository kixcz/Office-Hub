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

        return array_merge(parent::share($request), [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? array_merge($request->user()->toArray(), [
                    'roles' => $request->user()->roles->pluck('name'),
                    'is_faculty' => $request->user()->isFaculty(),
                    'is_college_admin' => $request->user()->isCollegeAdmin(),
                    'is_institution_super_admin' => $request->user()->isInstitutionSuperAdmin(),
                    'is_vpaf' => $request->user()->isVpaf(),
                    'can_switch_channels' => $request->user()->canSwitchTvChannels(),
                    'faculty' => $request->user()->faculty?->load('program'),
                ]) : null,
            ],
            'currentAcademicPeriod' => function () {
                return AcademicPeriod::current();
            },
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}
