<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/tv', [\App\Http\Controllers\TvDisplayController::class, 'index'])->name('tv');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    
    Route::resource('meetings', \App\Http\Controllers\MeetingController::class)->only(['index', 'store', 'destroy']);
    
    Route::resource('requests', \App\Http\Controllers\OfficeRequestController::class)->only(['index', 'store', 'update']);
    
    Route::resource('announcements', \App\Http\Controllers\AnnouncementController::class);

    Route::resource('announcements', \App\Http\Controllers\AnnouncementController::class);

    // Faculty Workspace (My Requirements)
    Route::get('/faculty/workspace', [\App\Http\Controllers\RequirementController::class, 'facultyWorkspace'])->name('faculty.workspace');
    
    // Compliance Matrix (Admin/Chair View)
    Route::get('/compliance-matrix', [\App\Http\Controllers\RequirementController::class, 'complianceMatrix'])->name('compliance.matrix');
    
    // Requirements CRUD
    Route::get('/requirements/create', [\App\Http\Controllers\RequirementController::class, 'create'])->name('requirements.create');
    Route::post('/requirements', [\App\Http\Controllers\RequirementController::class, 'store'])->name('requirements.store');
    Route::get('/requirements/{requirement}', [\App\Http\Controllers\RequirementController::class, 'show'])->name('requirements.show');
    
    // Submissions
    Route::post('/requirements/{requirement}/submissions', [\App\Http\Controllers\SubmissionController::class, 'store'])->name('submissions.store');
    Route::patch('/submissions/{submission}', [\App\Http\Controllers\SubmissionController::class, 'update'])->name('submissions.update');
    // Tasks
    Route::get('/tasks', [\App\Http\Controllers\TaskController::class, 'index'])->name('tasks.index');
    Route::post('/tasks', [\App\Http\Controllers\TaskController::class, 'store'])->name('tasks.store');
    Route::patch('/tasks/{task}', [\App\Http\Controllers\TaskController::class, 'update'])->name('tasks.update');
    // Accomplishments
    Route::get('/accomplishments', [\App\Http\Controllers\AccomplishmentController::class, 'index'])->name('accomplishments.index');
    Route::post('/accomplishments', [\App\Http\Controllers\AccomplishmentController::class, 'store'])->name('accomplishments.store');
    // Document Routing
    Route::get('/documents', [\App\Http\Controllers\DocumentRouteController::class, 'index'])->name('documents.index');
    Route::post('/documents', [\App\Http\Controllers\DocumentRouteController::class, 'store'])->name('documents.store');
    Route::patch('/documents/{document}', [\App\Http\Controllers\DocumentRouteController::class, 'update'])->name('documents.update');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
