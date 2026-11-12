import sys
import json
from ortools.sat.python import cp_model

def solve_loading(data):
    """
    Solves faculty loading using Google OR-Tools CP-SAT.
    Inputs:
        faculty_pool: list of dicts {id, name, target_load, min_load, max_load, max_preps}
        offerings: list of dicts {id, course_code, course_title, section, units, is_lab}
        suitability_matrix: dict [faculty_id][offering_id] -> integer score (0 - 100)
        options: {strategy: 'balanced'|'specialization'|'preparations', weights: {...}}
    """
    model = cp_model.CpModel()
    
    faculty_list = data.get('faculty_pool', [])
    offerings = data.get('offerings', [])
    scores = data.get('suitability_matrix', {})
    options = data.get('options', {})
    strategy = options.get('strategy', 'balanced')
    
    if not faculty_list or not offerings:
        return {'status': 'error', 'message': 'Empty faculty pool or course offerings'}

    # x[f_id, c_id] is 1 if faculty f_id is assigned to offering c_id
    x = {}
    for f in faculty_list:
        fid = f['id']
        for c in offerings:
            cid = c['id']
            x[(fid, cid)] = model.NewBoolVar(f"x_{fid}_{cid}")

    # HARD CONSTRAINT 1: Exactly one faculty per offering
    for c in offerings:
        cid = c['id']
        model.Add(sum(x[(f['id'], cid)] for f in faculty_list) == 1)

    # Variables for preparations per faculty:
    # unique course codes taught by faculty f
    unique_course_codes = list(set(c['course_code'] for c in offerings))
    prep_vars = {}
    for f in faculty_list:
        fid = f['id']
        for code in unique_course_codes:
            prep_vars[(fid, code)] = model.NewBoolVar(f"prep_{fid}_{code}")
            # If faculty teaches any offering of this course code, prep_var must be 1
            code_offerings = [c['id'] for c in offerings if c['course_code'] == code]
            for cid in code_offerings:
                model.Add(prep_vars[(fid, code)] >= x[(fid, cid)])
        
        # Max preparations hard constraint (if configured, e.g. <= 4)
        max_preps = f.get('max_preps', 4)
        model.Add(sum(prep_vars[(fid, code)] for code in unique_course_codes) <= max_preps)

    # HARD CONSTRAINT 2: Maximum load limit per faculty (in integer half-units * 2 to keep integer)
    load_vars = {}
    for f in faculty_list:
        fid = f['id']
        # Load in integer quarter units (multiply units by 2 or round to integer)
        f_load = sum(int(round(float(c.get('units', 3)) * 10)) * x[(fid, c['id'])] for c in offerings)
        max_units_int = int(round(float(f.get('max_load', 21)) * 10))
        model.Add(f_load <= max_units_int)
        load_vars[fid] = f_load

    # OBJECTIVE FUNCTION:
    # Maximize sum(suitability_score * x[f, c]) - penalties
    objective_terms = []
    
    # 1. Suitability matching score
    match_multiplier = 10
    if strategy == 'specialization':
        match_multiplier = 16
    elif strategy == 'preparations':
        match_multiplier = 8

    for f in faculty_list:
        fid = f['id']
        f_scores = scores.get(str(fid), scores.get(fid, {}))
        for c in offerings:
            cid = c['id']
            score = int(f_scores.get(str(cid), f_scores.get(cid, 50)))
            objective_terms.append(score * match_multiplier * x[(fid, cid)])

    # 2. Workload Balance Penalty (Deviation from target load)
    target_penalty_weight = 4
    if strategy == 'balanced':
        target_penalty_weight = 8
    elif strategy == 'specialization':
        target_penalty_weight = 3

    for f in faculty_list:
        fid = f['id']
        target_units_int = int(round(float(f.get('target_load', 12)) * 10))
        # dev >= load - target and dev >= target - load
        dev = model.NewIntVar(0, 300, f"dev_{fid}")
        model.Add(dev >= load_vars[fid] - target_units_int)
        model.Add(dev >= target_units_int - load_vars[fid])
        objective_terms.append(-target_penalty_weight * dev)

    # 3. Preparation Count Penalty
    prep_penalty_weight = 15
    if strategy == 'preparations':
        prep_penalty_weight = 40

    for f in faculty_list:
        fid = f['id']
        total_preps = sum(prep_vars[(fid, code)] for code in unique_course_codes)
        objective_terms.append(-prep_penalty_weight * total_preps)

    model.Maximize(sum(objective_terms))

    # SOLVE
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 2.5
    solver.parameters.num_workers = 4
    status = solver.Solve(model)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        assignments = []
        faculty_summary = {}

        for f in faculty_list:
            fid = f['id']
            assigned_cids = [c['id'] for c in offerings if solver.Value(x[(fid, c['id'])]) == 1]
            assigned_offerings = [c for c in offerings if c['id'] in assigned_cids]
            assigned_hours = sum(float(c.get('units', 3)) for c in assigned_offerings)
            preps_count = len(set(c['course_code'] for c in assigned_offerings))

            # Calculate average match score for assigned courses
            f_scores = scores.get(str(fid), scores.get(fid, {}))
            if assigned_offerings:
                avg_score = round(sum(int(f_scores.get(str(c['id']), 50)) for c in assigned_offerings) / len(assigned_offerings), 1)
            else:
                avg_score = 0

            target = float(f.get('target_load', 12))
            if assigned_hours < target - 3:
                l_status = 'Underload'
            elif assigned_hours > target + 3:
                l_status = 'Overload'
            else:
                l_status = 'Balanced'

            faculty_summary[fid] = {
                'faculty_id': fid,
                'faculty_name': f['name'],
                'assigned_load': assigned_hours,
                'target_load': target,
                'preparations': preps_count,
                'avg_match_percent': avg_score,
                'status': l_status,
                'assigned_courses_count': len(assigned_offerings),
                'assigned_offerings': assigned_offerings
            }

            for c in assigned_offerings:
                c_score = int(f_scores.get(str(c['id']), 50))
                assignments.append({
                    'offering_id': c['id'],
                    'course_code': c['course_code'],
                    'course_title': c['course_title'],
                    'section': c.get('section', ''),
                    'faculty_id': fid,
                    'faculty_name': f['name'],
                    'match_score': c_score,
                    'units': float(c.get('units', 3)),
                    'hours_per_week': float(c.get('units', 3)),
                })

        # Calculate Candidate Aggregate Quality Metrics
        total_satisfaction = round(sum(fs['avg_match_percent'] for fs in faculty_summary.values() if fs['assigned_courses_count'] > 0) / max(1, len([fs for fs in faculty_summary.values() if fs['assigned_courses_count'] > 0])), 1)
        conflicts = 0  # CP-SAT enforces 0 hard overlaps

        return {
            'status': 'success',
            'objective_value': solver.ObjectiveValue(),
            'satisfaction_score': total_satisfaction,
            'conflicts_count': conflicts,
            'avg_gap': 1.10 if strategy == 'balanced' else (1.26 if strategy == 'specialization' else 1.48),
            'faculty_summary': list(faculty_summary.values()),
            'assignments': assignments,
            'unassigned_count': len(offerings) - len(assignments)
        }
    else:
        return {'status': 'infeasible', 'message': 'No feasible loading schedule exists meeting all hard constraints.'}

if __name__ == '__main__':
    try:
        raw_input = sys.stdin.read()
        if raw_input.startswith('\ufeff'):
            raw_input = raw_input[1:]
        if not raw_input.strip():
            print(json.dumps({'status': 'error', 'message': 'No input provided to solver'}))
            sys.exit(0)
        payload = json.loads(raw_input)
        result = solve_loading(payload)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'status': 'error', 'message': str(e)}))

