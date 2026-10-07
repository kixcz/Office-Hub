<?php

use App\Http\Controllers\AccomplishmentController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentRouteController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\OfficeRequestController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\RequirementController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TvDisplayController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/tv', [TvDisplayController::class, 'index'])->name('tv');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('meetings', MeetingController::class)->only(['index', 'store', 'destroy']);

    Route::resource('requests', OfficeRequestController::class)->only(['index', 'store', 'update']);

    Route::resource('announcements', AnnouncementController::class);

    Route::resource('announcements', AnnouncementController::class);

    // Compliance Section
    Route::prefix('compliance')->name('compliance.')->group(function () {
        Route::resource('requirements', \App\Http\Controllers\Compliance\RequirementController::class);
        Route::resource('submissions', \App\Http\Controllers\Compliance\SubmissionController::class);
        Route::get('pending-outputs', [\App\Http\Controllers\Compliance\PendingOutputController::class, 'index'])->name('pending-outputs.index');
        Route::get('tracker', [\App\Http\Controllers\Compliance\ComplianceTrackerController::class, 'index'])->name('tracker.index');
    });
    // Tasks
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::patch('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    // Accomplishments
    Route::get('/accomplishments', [AccomplishmentController::class, 'index'])->name('accomplishments.index');
    Route::post('/accomplishments', [AccomplishmentController::class, 'store'])->name('accomplishments.store');
    // Document Routing
    Route::get('/documents', [DocumentRouteController::class, 'index'])->name('documents.index');
    Route::post('/documents', [DocumentRouteController::class, 'store'])->name('documents.store');
    Route::patch('/documents/{document}', [DocumentRouteController::class, 'update'])->name('documents.update');

    // Programs & Faculties
    Route::resource('programs', ProgramController::class);
    Route::resource('faculties', FacultyController::class);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
