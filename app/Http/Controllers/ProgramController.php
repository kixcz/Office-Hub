<?php

namespace App\Http\Controllers;

use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProgramController extends Controller
{
    public function index(Request $request)
    {
        $query = Program::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $programs = $query->orderBy('id', 'asc')->get();

        $totalPrograms = Program::count();
        $activePrograms = $totalPrograms; // All active and offered
        $degreeTypes = 2; // Bachelor's programs (Computer Studies / Library Sciences)

        // Find last updated program
        $lastProgram = Program::latest('updated_at')->first();
        $lastUpdatedDate = $lastProgram && $lastProgram->updated_at ? $lastProgram->updated_at->format('M j, Y') : now()->format('M j, Y');
        $lastUpdatedTime = $lastProgram && $lastProgram->updated_at ? $lastProgram->updated_at->format('g:i A').' by System Admin' : '11:25 AM by System Admin';

        return Inertia::render('programs/index', [
            'programs' => $programs,
            'stats' => [
                'total' => $totalPrograms,
                'active' => $activePrograms,
                'degree_types' => $degreeTypes,
                'last_updated_date' => $lastUpdatedDate,
                'last_updated_time' => $lastUpdatedTime,
            ],
            'departments' => [
                'College of Information and Digital Sciences',
            ],
            'filters' => [
                'search' => $request->input('search', ''),
                'department' => $request->input('department', 'all'),
                'status' => $request->input('status', 'all'),
            ],
        ]);
    }

    protected static function ensureBaselinePrograms(): void
    {
        $baseline = [
            [
                'code' => 'BLIS',
                'name' => 'Bachelor of Library and Information Science',
                'description' => null,
            ],
            [
                'code' => 'BSCS',
                'name' => 'Bachelor of Science in Computer Science',
                'description' => null,
            ],
            [
                'code' => 'BSIT',
                'name' => 'Bachelor of Science in Information Technology',
                'description' => null,
            ],
            [
                'code' => 'BSIS',
                'name' => 'Bachelor of Science in Information Systems',
                'description' => null,
            ],
        ];

        foreach ($baseline as $data) {
            Program::firstOrCreate(
                ['code' => $data['code']],
                [
                    'name' => $data['name'],
                    'description' => $data['description'],
                ]
            );
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:programs,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        Program::create($validated);

        return redirect()->back()->with('success', 'Program created successfully.');
    }

    public function update(Request $request, Program $program)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:programs,code,'.$program->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $program->update($validated);

        return redirect()->back()->with('success', 'Program updated successfully.');
    }

    public function destroy(Program $program)
    {
        $program->delete();

        return redirect()->back()->with('success', 'Program deleted successfully.');
    }
}
