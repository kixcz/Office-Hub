<?php

use App\Http\Middleware\EnforceActiveRoleContext;
use App\Http\Middleware\HandleInertiaRequests;
use App\Services\PortalContextService;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->redirectGuestsTo('/login');
        $middleware->redirectUsersTo(function (Request $request) {
            $user = $request->user();
            if (! $user) {
                return '/dashboard';
            }

            if ($user->hasRole('Display Screen') || $user->hasRole('tv_display') || $user->email === 'tv@cids.edu.ph') {
                return route('tv-display', absolute: false);
            }

            $portalService = app(PortalContextService::class);
            $active = $portalService->getActiveAssignment($user, $request);

            return $active['landing_url'] ?? '/dashboard';
        });

        $middleware->web(append: [
            EnforceActiveRoleContext::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            $status = $response->getStatusCode();

            if (in_array($status, [403, 404]) && ! $request->is('api/*')) {
                $user = $request->user();
                $portalService = app(PortalContextService::class);
                $active = $user ? $portalService->getActiveAssignment($user, $request) : null;
                $available = $user ? $portalService->getUserAvailableAssignments($user) : collect();

                $message = $exception->getMessage();
                $path = $request->path();

                // Infer required workspace from path or message
                $requiredWorkspace = null;
                $targetAssignmentId = null;

                if (str_starts_with($path, 'faculty')) {
                    $requiredWorkspace = 'Faculty';
                    $targetAssignmentId = $available->firstWhere('portal_type', 'faculty')['id'] ?? null;
                } elseif (str_starts_with($path, 'vpaf')) {
                    $requiredWorkspace = 'VPAF Executive';
                    $targetAssignmentId = $available->firstWhere('portal_type', 'vpaf')['id'] ?? null;
                } elseif (str_starts_with($path, 'institution')) {
                    $requiredWorkspace = 'Institution Super Admin';
                    $targetAssignmentId = $available->firstWhere('portal_type', 'institution_super_admin')['id'] ?? null;
                }

                return Inertia::render('error', [
                    'status' => $status,
                    'message' => $message ?: null,
                    'currentWorkspace' => $active['display_label'] ?? 'Current Workspace',
                    'requiredWorkspace' => $requiredWorkspace,
                    'targetAssignmentId' => $targetAssignmentId,
                ])
                    ->toResponse($request)
                    ->setStatusCode($status);
            }

            return $response;
        });
    })->create();
