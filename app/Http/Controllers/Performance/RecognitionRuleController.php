<?php

namespace App\Http\Controllers\Performance;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use App\Models\Program;
use App\Models\RecognitionRule;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RecognitionRuleController extends Controller
{
    public function index()
    {
        $rules = RecognitionRule::all();

        // Let's also evaluate the rules dynamically to show winners
        $faculties = Faculty::with(['program', 'submissions.requirement'])->get()->map(function ($f) {
            $total = $f->submissions->count();
            $onTime = 0;
            $complied = 0;
            $overdue = 0;
            foreach ($f->submissions as $s) {
                if ($s->submitted_at) {
                    $complied++;
                    if (! Carbon::parse($s->submitted_at)->greaterThan(Carbon::parse($s->requirement->due_date))) {
                        $onTime++;
                    }
                } elseif (now()->greaterThan(Carbon::parse($s->requirement->due_date))) {
                    $overdue++;
                }
            }

            return [
                'id' => $f->id,
                'name' => $f->first_name.' '.$f->last_name,
                'program' => $f->program ? $f->program->code : '',
                'total' => $total,
                'on_time_rate' => $total > 0 ? round(($onTime / $total) * 100, 2) : 0,
                'compliance_rate' => $total > 0 ? round(($complied / $total) * 100, 2) : 0,
                'overdue' => $overdue,
            ];
        });

        $programs = Program::with(['faculties.submissions.requirement'])->get()->map(function ($p) {
            $total = 0;
            $onTime = 0;
            $complied = 0;
            $overdue = 0;
            foreach ($p->faculties as $f) {
                foreach ($f->submissions as $s) {
                    $total++;
                    if ($s->submitted_at) {
                        $complied++;
                        if (! Carbon::parse($s->submitted_at)->greaterThan(Carbon::parse($s->requirement->due_date))) {
                            $onTime++;
                        }
                    } elseif (now()->greaterThan(Carbon::parse($s->requirement->due_date))) {
                        $overdue++;
                    }
                }
            }

            return [
                'id' => $p->id,
                'name' => $p->code,
                'total' => $total,
                'on_time_rate' => $total > 0 ? round(($onTime / $total) * 100, 2) : 0,
                'compliance_rate' => $total > 0 ? round(($complied / $total) * 100, 2) : 0,
                'overdue' => $overdue,
            ];
        });

        $recognitions = [];
        foreach ($rules as $rule) {
            if ($rule->type === 'faculty') {
                $candidates = $faculties->filter(function ($c) use ($rule) {
                    return $c['total'] >= $rule->min_requirements &&
                           $c['on_time_rate'] >= $rule->min_on_time_rate &&
                           $c['compliance_rate'] >= $rule->min_compliance_rate &&
                           ($rule->allow_overdue || $c['overdue'] === 0);
                })->sortByDesc('on_time_rate')->values();
                $recognitions[] = ['rule' => $rule, 'winners' => $candidates];
            } else {
                $candidates = $programs->filter(function ($c) use ($rule) {
                    return $c['total'] >= $rule->min_requirements &&
                           $c['on_time_rate'] >= $rule->min_on_time_rate &&
                           $c['compliance_rate'] >= $rule->min_compliance_rate &&
                           ($rule->allow_overdue || $c['overdue'] === 0);
                })->sortByDesc('on_time_rate')->values();
                $recognitions[] = ['rule' => $rule, 'winners' => $candidates];
            }
        }

        return Inertia::render('performance/rules/index', [
            'rules' => $rules,
            'recognitions' => $recognitions,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'type' => 'required|string|in:faculty,program',
            'min_requirements' => 'required|integer|min:0',
            'min_on_time_rate' => 'required|numeric|min:0|max:100',
            'min_compliance_rate' => 'required|numeric|min:0|max:100',
            'allow_overdue' => 'boolean',
        ]);

        RecognitionRule::create($validated);

        return redirect()->back();
    }

    public function destroy(RecognitionRule $rule)
    {
        $rule->delete();

        return redirect()->back();
    }
}
