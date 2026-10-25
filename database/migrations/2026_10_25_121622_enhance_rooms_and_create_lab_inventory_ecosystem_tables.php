<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Enhance Rooms table with facility capabilities and operational rules
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('room_code')->nullable()->after('id');
            $table->string('custom_type')->nullable()->after('type'); // Configurable custom facility type
            $table->string('operational_status')->default('Available')->after('status');
            // Available, In Use as Scheduled, Occupied Unexpectedly, Reserved, Maintenance, Utility Failure, Closed
            $table->string('operating_hours')->default('7:00 AM - 7:00 PM')->after('status');
            $table->json('supported_activities')->nullable()->after('operating_hours'); // ['Lecture', 'Laboratory', 'Exam', 'Meeting', 'Workshop']
            $table->json('capabilities')->nullable()->after('supported_activities');
            // { has_projector, num_workstations, internet_type, specialized_software, has_aircon, equipment_list, power_redundancy, accessibility }
            $table->json('availability_rules')->nullable()->after('capabilities');
            // { regular_hours, blocked_periods, recurring_maintenance, temporary_closures }
            $table->date('effective_from')->nullable()->after('availability_rules');
            $table->date('effective_until')->nullable()->after('effective_from');
            $table->boolean('is_accessible')->default(true)->after('effective_until');
        });

        // 2. Lab Inventory Items (Serialized assets, non-serialized equipment, consumables)
        Schema::create('lab_inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->string('room_name')->nullable()->index(); // Denormalized for resilience
            $table->string('asset_number')->nullable()->unique()->index();
            $table->string('item_name')->index();
            $table->enum('tracking_type', ['serialized', 'non_serialized', 'consumable'])->default('serialized');
            $table->string('category')->index(); // Computers, Networking, Audio/Visual, Furniture, Peripherals, Tools, Consumables
            $table->string('brand_model')->nullable();
            $table->string('serial_number')->nullable()->index();
            $table->string('college')->default('College of Information and Computing Studies (CIDS)');
            $table->integer('quantity')->default(1);
            $table->string('unit')->default('pcs'); // pcs, units, sets, rolls, boxes, meters
            $table->enum('condition', [
                'Operational',
                'Operational with Minor Issue',
                'For Inspection',
                'For Repair',
                'Under Maintenance',
                'Damaged',
                'Missing',
                'Transferred',
                'Condemned',
                'Disposed',
            ])->default('Operational')->index();
            $table->string('operational_status')->default('Active'); // Active, In Repair, Storage, Written Off
            $table->string('custodian')->nullable(); // Head Lab In-Charge or Faculty member accountable
            $table->string('acquisition_batch')->nullable();
            $table->date('acquisition_date')->nullable();
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->string('warranty_info')->nullable();
            $table->date('last_inspected_at')->nullable();
            $table->date('next_inspection_due')->nullable();
            $table->text('specs_details')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        // 3. Inventory Adjustments & Discrepancy Verification Workflow
        Schema::create('lab_inventory_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('lab_inventory_items')->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['Count Discrepancy', 'Damage Report', 'Missing Report', 'Surplus Found', 'Disposal', 'Transfer']);
            $table->integer('previous_quantity');
            $table->integer('new_quantity');
            $table->string('previous_condition')->nullable();
            $table->string('new_condition')->nullable();
            $table->text('reason');
            $table->text('reviewer_notes')->nullable();
            $table->enum('status', ['Pending Verification', 'Approved', 'Rejected', 'Reconciled'])->default('Pending Verification');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        // 4. Lab Maintenance Tickets
        Schema::create('lab_maintenance_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->nullable()->constrained('lab_inventory_items')->nullOnDelete();
            $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->foreignId('reported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('ticket_number')->unique();
            $table->string('title');
            $table->text('reported_problem');
            $table->enum('severity', ['Low', 'Medium', 'High', 'Critical'])->default('Medium');
            $table->string('assigned_technician')->nullable();
            $table->enum('repair_status', ['Reported', 'Triaged', 'In Progress', 'Awaiting Parts', 'Completed', 'Cancelled'])->default('Reported');
            $table->decimal('cost', 10, 2)->nullable();
            $table->date('start_date')->nullable();
            $table->date('completion_date')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();
        });

        // 5. Periodic Physical Inspection Cycles & Findings
        Schema::create('lab_inspection_cycles', function (Blueprint $table) {
            $table->id();
            $table->string('cycle_name'); // e.g. "AY 2026-2027 Midterm Physical Inventory"
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->foreignId('assigned_inspector_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('start_date');
            $table->date('due_date');
            $table->enum('status', ['Scheduled', 'In Progress', 'Completed', 'Archived'])->default('Scheduled');
            $table->integer('total_expected_items')->default(0);
            $table->integer('total_counted_items')->default(0);
            $table->integer('discrepancies_count')->default(0);
            $table->text('summary_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('lab_inspection_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspection_cycle_id')->constrained('lab_inspection_cycles')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('lab_inventory_items')->cascadeOnDelete();
            $table->integer('expected_quantity')->default(1);
            $table->integer('actual_counted_quantity')->default(1);
            $table->string('expected_condition')->default('Operational');
            $table->string('actual_condition')->default('Operational');
            $table->enum('finding_status', ['Matched', 'Missing', 'Damaged', 'Surplus', 'Unverified'])->default('Matched');
            $table->text('inspector_notes')->nullable();
            $table->timestamp('inspected_at')->nullable();
            $table->timestamps();
        });

        // 6. Complete Inventory Audit Logs
        Schema::create('lab_inventory_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->nullable()->constrained('lab_inventory_items')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action'); // Created, Updated, Condition Changed, Relocated, Quantity Adjusted, Disposed
            $table->json('previous_state')->nullable();
            $table->json('new_state')->nullable();
            $table->string('justification')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lab_inventory_audit_logs');
        Schema::dropIfExists('lab_inspection_findings');
        Schema::dropIfExists('lab_inspection_cycles');
        Schema::dropIfExists('lab_maintenance_tickets');
        Schema::dropIfExists('lab_inventory_adjustments');
        Schema::dropIfExists('lab_inventory_items');

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn([
                'room_code',
                'custom_type',
                'operational_status',
                'operating_hours',
                'supported_activities',
                'capabilities',
                'availability_rules',
                'effective_from',
                'effective_until',
                'is_accessible',
            ]);
        });
    }
};
