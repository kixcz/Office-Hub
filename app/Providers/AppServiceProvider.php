<?php

namespace App\Providers;

use App\Http\Controllers\Schedule\CalendarController;
use App\Models\Activity;
use App\Models\Faculty;
use App\Models\FacultyAttendance;
use App\Models\Meeting;
use App\Models\Program;
use App\Models\Requirement;
use App\Models\RoomSchedule;
use App\Models\Submission;
use App\Services\ComplianceService;
use Illuminate\Database\Connection;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Dynamic Role & Permission authorization gate
        Gate::before(function ($user, string $ability) {
            if (method_exists($user, 'isInstitutionSuperAdmin') && $user->isInstitutionSuperAdmin()) {
                return true;
            }

            if (method_exists($user, 'hasPermissionTo') && $user->hasPermissionTo($ability)) {
                return true;
            }
        });

        // Structured monitoring for slow SQL queries (> 500ms)
        DB::whenQueryingForLongerThan(500, function (Connection $connection, QueryExecuted $event) {
            Log::warning('Slow SQL query threshold exceeded on connection.', [
                'connection' => $connection->getName(),
                'sql' => $event->sql,
                'time_ms' => $event->time,
                'url' => app()->runningInConsole() ? 'console' : request()->fullUrl(),
            ]);
        });

        // Event-driven cache invalidation on core model mutations
        $flushFacultyCaches = static function (): void {
            Cache::forget('officehub_faculty_dropdown_options_v1');
            Cache::forget('officehub_faculty_dropdown_options_v2');
            ComplianceService::flushSyncCache();
        };
        Faculty::saved($flushFacultyCaches);
        Faculty::deleted($flushFacultyCaches);

        $flushProgramCaches = static function (): void {
            Cache::forget(Meeting::PROGRAMS_LOOKUP_CACHE_KEY);
            Cache::forget('officehub_faculty_dropdown_options_v1');
            Cache::forget('officehub_faculty_dropdown_options_v2');
            Cache::forget(CalendarController::CALENDAR_DATA_CACHE_KEY);
        };
        Program::saved($flushProgramCaches);
        Program::deleted($flushProgramCaches);

        $flushRoomScheduleCaches = static function (): void {
            FacultyAttendance::flushScheduleCache();
        };
        RoomSchedule::saved($flushRoomScheduleCaches);
        RoomSchedule::deleted($flushRoomScheduleCaches);

        $flushRequirementCaches = static function (): void {
            ComplianceService::flushSyncCache();
            Cache::forget(CalendarController::CALENDAR_DATA_CACHE_KEY);
        };
        Requirement::saved($flushRequirementCaches);
        Requirement::deleted($flushRequirementCaches);

        $flushCalendarCaches = static function (): void {
            Cache::forget(CalendarController::CALENDAR_DATA_CACHE_KEY);
        };
        Meeting::saved($flushCalendarCaches);
        Meeting::deleted($flushCalendarCaches);
        Activity::saved($flushCalendarCaches);
        Activity::deleted($flushCalendarCaches);
        Submission::saved(static function (): void {
            Cache::forget('tv_classroom_monitoring_summary_v3');
        });
    }
}
