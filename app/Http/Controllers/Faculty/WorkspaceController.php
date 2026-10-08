<?php

namespace App\Http\Controllers\Faculty;

use App\Http\Controllers\Controller;
use App\Models\Requirement;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WorkspaceController extends Controller
{
    public function index(Request $request)
    {
        // Get requirements assigned to the currently logged in faculty member
        // For now we'll just get all requirements and their submissions for the current user.
        // Assuming user() has an employee_id or faculty relationship, but since auth is generic
        // we'll filter submissions by the logged-in user.
        
        $requirements = Requirement::with(['submissions' => function($query) use ($request) {
            $query->where('user_id', $request->user()->id)->latest();
        }])->latest()->paginate(10);

        return Inertia::render('faculty/workspace', [
            'requirements' => $requirements,
        ]);
    }
}
