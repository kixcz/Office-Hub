<?php

namespace Database\Seeders;

use App\Models\LabInspectionCycle;
use App\Models\LabInventoryItem;
use App\Models\LabMaintenanceTicket;
use App\Models\Room;
use App\Models\User;
use Illuminate\Database\Seeder;

class RoomsAndLabInventorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminUser = User::first();
        $adminId = $adminUser ? $adminUser->id : 1;

        // 1. Update and enrich all Room records
        $rooms = Room::all();
        foreach ($rooms as $r) {
            $name = $r->room_name;
            $code = strtoupper(str_replace([' ', '(', ')'], ['-', '', ''], $name));
            $isLab = str_contains(strtolower($name), 'lab') || str_contains(strtolower($name), 'clr') || str_contains(strtolower($name), 'studio');
            $isNetLab = str_contains(strtolower($name), 'network');
            $isMacLab = str_contains(strtolower($name), 'mac');
            $isConference = str_contains(strtolower($name), 'conference');
            $isOffice = str_contains(strtolower($name), 'office') || str_contains(strtolower($name), 'dean');

            $facilityType = $isNetLab ? 'Networking Laboratory'
                : ($isMacLab ? 'Computer Laboratory (Mac)'
                : ($isLab ? 'Computer Laboratory'
                : ($isConference ? 'Conference Room'
                : ($isOffice ? 'Office' : 'Lecture Room'))));

            $r->update([
                'room_code' => $code,
                'custom_type' => $facilityType,
                'operational_status' => $r->status === 'Under Repair' ? 'Maintenance' : 'Available',
                'operating_hours' => '7:00 AM - 7:00 PM',
                'supported_activities' => $isLab ? ['Laboratory', 'Lecture', 'Exam', 'Hands-on Workshop'] : ['Lecture', 'Exam', 'Consultation', 'Meeting'],
                'capabilities' => [
                    'has_projector' => true,
                    'num_workstations' => $isLab ? $r->capacity : 0,
                    'internet_type' => $isLab ? 'Gigabit Ethernet + Wi-Fi 6' : 'Campus Wi-Fi',
                    'specialized_software' => $isNetLab ? ['Cisco Packet Tracer', 'Wireshark', 'GNS3']
                        : ($isMacLab ? ['Xcode', 'Final Cut Pro', 'Logic Pro', 'Adobe Creative Cloud']
                        : ($isLab ? ['VS Code', 'Node.js', 'MySQL Workbench', 'XAMPP', 'Python 3.12'] : [])),
                    'has_aircon' => true,
                    'power_redundancy' => $isLab ? 'UPS Protected' : 'Standard Grid',
                    'specialized_equipment' => $isNetLab ? 'Cisco 2960 Switches, 2911 Routers, Patch Panels'
                        : ($isLab ? 'Interactive Display & Whiteboard' : 'Ceiling Mounted HD Projector'),
                ],
                'availability_rules' => [
                    'regular_hours' => 'Monday - Saturday: 7:00 AM - 7:00 PM',
                    'blocked_periods' => [],
                    'recurring_maintenance' => $isLab ? ['Friday 5:00 PM - 7:00 PM'] : [],
                    'temporary_closures' => [],
                ],
                'is_accessible' => true,
            ]);
        }

        // 2. Populate Lab Inventory Items for Key Laboratories
        if (LabInventoryItem::count() === 0) {
            $clr1 = Room::where('room_name', 'CLR 1')->first();
            $clr2 = Room::where('room_name', 'CLR 2')->first();
            $clr3 = Room::where('room_name', 'CLR 3')->first();
            $clr4 = Room::where('room_name', 'like', '%CLR 4%')->first();
            $clr5 = Room::where('room_name', 'like', '%CLR 5%')->first();

            $targetLabs = array_filter([$clr1, $clr2, $clr3, $clr4, $clr5]);

            foreach ($targetLabs as $lab) {
                $isMac = str_contains(strtolower($lab->room_name), 'mac');
                $isNet = str_contains(strtolower($lab->room_name), 'network');

                // A. Desktop PCs / Workstations (Serialized)
                $pcCount = $lab->capacity ?: 40;
                for ($i = 1; $i <= $pcCount; $i++) {
                    $pad = str_pad($i, 2, '0', STR_PAD_LEFT);
                    $assetNum = "AST-{$lab->room_code}-PC{$pad}";
                    $serialNum = 'SN-'.strtoupper(substr(md5($assetNum), 0, 10));

                    $condition = 'Operational';
                    $opStatus = 'Active';

                    // Inject realistic minor discrepancies / repairs
                    if ($i === 15) {
                        $condition = 'Operational with Minor Issue';
                    } elseif ($i === 22) {
                        $condition = 'For Repair';
                        $opStatus = 'In Repair';
                    }

                    $item = LabInventoryItem::create([
                        'room_id' => $lab->id,
                        'room_name' => $lab->room_name,
                        'asset_number' => $assetNum,
                        'item_name' => $isMac ? "Apple iMac 24\" M3 - Station {$i}" : "Dell OptiPlex 7090 Core i7 - Station {$i}",
                        'tracking_type' => 'serialized',
                        'category' => 'Computers & Workstations',
                        'brand_model' => $isMac ? 'Apple iMac 24" M3 / 16GB / 512GB SSD' : 'Dell OptiPlex 7090 / 16GB RAM / 512GB NVMe',
                        'serial_number' => $serialNum,
                        'quantity' => 1,
                        'unit' => 'unit',
                        'condition' => $condition,
                        'operational_status' => $opStatus,
                        'custodian' => 'Head Lab In-Charge',
                        'acquisition_batch' => 'BATCH-2024-Q3',
                        'acquisition_date' => '2024-08-15',
                        'unit_cost' => $isMac ? 78500.00 : 45000.00,
                        'warranty_info' => '3 Years On-Site Support (Exp: Aug 2027)',
                        'last_inspected_at' => '2026-09-15',
                        'next_inspection_due' => '2026-11-15',
                        'specs_details' => 'Includes 24" Display, USB Mouse, Keyboard, and Gigabit NIC',
                        'remarks' => $condition === 'For Repair' ? 'Power supply intermittent failure reported' : 'Fully verified during semester startup',
                    ]);

                    // If in repair, create a Maintenance Ticket
                    if ($condition === 'For Repair') {
                        LabMaintenanceTicket::create([
                            'item_id' => $item->id,
                            'room_id' => $lab->id,
                            'reported_by' => $adminId,
                            'ticket_number' => 'TCK-'.date('Y')."-{$lab->room_code}-001",
                            'title' => "Intermittent PSU Defect on {$item->item_name}",
                            'reported_problem' => 'PC shuts down unexpectedly after 15 minutes of heavy load.',
                            'severity' => 'Medium',
                            'assigned_technician' => 'Campus IT Service Desk',
                            'repair_status' => 'In Progress',
                            'cost' => 1850.00,
                            'start_date' => date('Y-m-d', strtotime('-3 days')),
                            'resolution_notes' => 'Diagnostic in progress. Replacement 500W PSU ordered.',
                        ]);
                    }
                }

                // B. Overhead Projector & Smart Interactive Display
                LabInventoryItem::create([
                    'room_id' => $lab->id,
                    'room_name' => $lab->room_name,
                    'asset_number' => "AST-{$lab->room_code}-PRJ01",
                    'item_name' => 'Epson EB-2250U Full HD Projector',
                    'tracking_type' => 'serialized',
                    'category' => 'Audio / Visual',
                    'brand_model' => 'Epson EB-2250U 5000 Lumens',
                    'serial_number' => 'EP-'.strtoupper(substr(md5("PRJ-{$lab->id}"), 0, 8)),
                    'quantity' => 1,
                    'unit' => 'unit',
                    'condition' => 'Operational',
                    'operational_status' => 'Active',
                    'custodian' => 'Head Lab In-Charge',
                    'acquisition_batch' => 'BATCH-2024-Q1',
                    'acquisition_date' => '2024-02-10',
                    'unit_cost' => 62000.00,
                    'warranty_info' => '2 Years Standard',
                    'last_inspected_at' => '2026-09-15',
                    'next_inspection_due' => '2026-11-15',
                    'specs_details' => 'Ceiling mounted, HDMI/VGA/Wireless Screen Mirroring',
                ]);

                // C. Network Switches (Serialized)
                LabInventoryItem::create([
                    'room_id' => $lab->id,
                    'room_name' => $lab->room_name,
                    'asset_number' => "AST-{$lab->room_code}-SW01",
                    'item_name' => 'Cisco Catalyst 2960-X 48-Port PoE Switch',
                    'tracking_type' => 'serialized',
                    'category' => 'Networking Equipment',
                    'brand_model' => 'Cisco WS-C2960X-48FPS-L',
                    'serial_number' => 'FCW-'.strtoupper(substr(md5("SW-{$lab->id}"), 0, 8)),
                    'quantity' => 1,
                    'unit' => 'unit',
                    'condition' => 'Operational',
                    'operational_status' => 'Active',
                    'custodian' => 'Head Lab In-Charge',
                    'acquisition_batch' => 'BATCH-2023-Q4',
                    'acquisition_date' => '2023-11-20',
                    'unit_cost' => 125000.00,
                    'warranty_info' => 'Cisco SMARTnet Active',
                    'last_inspected_at' => '2026-09-15',
                    'next_inspection_due' => '2026-11-15',
                    'specs_details' => 'Rack-mounted in lab server cabinet with Gigabit uplink',
                ]);

                // D. Non-Serialized Equipment (Chairs, Peripherals)
                LabInventoryItem::create([
                    'room_id' => $lab->id,
                    'room_name' => $lab->room_name,
                    'asset_number' => "EQP-{$lab->room_code}-CHR",
                    'item_name' => 'Ergonomic Mesh Computer Chairs',
                    'tracking_type' => 'non_serialized',
                    'category' => 'Furniture & Fixtures',
                    'brand_model' => 'Mandue Ergonomics Pro',
                    'quantity' => $lab->capacity ?: 40,
                    'unit' => 'pcs',
                    'condition' => 'Operational',
                    'operational_status' => 'Active',
                    'custodian' => 'Head Lab In-Charge',
                    'acquisition_batch' => 'BATCH-2024-Q3',
                    'acquisition_date' => '2024-08-10',
                    'unit_cost' => 3200.00,
                    'last_inspected_at' => '2026-09-15',
                    'next_inspection_due' => '2026-11-15',
                    'remarks' => '38 fully intact, 2 showing minor caster wheel wear',
                ]);

                // E. Consumables (Ethernet Cables, RJ45 Connectors, Thermal Paste)
                LabInventoryItem::create([
                    'room_id' => $lab->id,
                    'room_name' => $lab->room_name,
                    'asset_number' => "CSM-{$lab->room_code}-RJ45",
                    'item_name' => 'Cat6 RJ45 Modular Plugs (Gold Plated)',
                    'tracking_type' => 'consumable',
                    'category' => 'Consumables & Parts',
                    'brand_model' => 'CommScope Cat6 Unshielded',
                    'quantity' => 180,
                    'unit' => 'pcs',
                    'condition' => 'Operational',
                    'operational_status' => 'Active',
                    'custodian' => 'Head Lab In-Charge',
                    'unit_cost' => 12.50,
                    'remarks' => 'For hands-on student cabling exercises and maintenance',
                ]);
            }

            // 3. Create an Initial Physical Inspection Cycle
            $firstLab = $targetLabs[0] ?? null;
            if ($firstLab) {
                LabInspectionCycle::create([
                    'cycle_name' => 'AY 2026-2027 Midterm Laboratory Asset Audit',
                    'created_by' => $adminId,
                    'room_id' => $firstLab->id,
                    'assigned_inspector_id' => $adminId,
                    'start_date' => '2026-10-01',
                    'due_date' => '2026-10-31',
                    'status' => 'In Progress',
                    'total_expected_items' => 45,
                    'total_counted_items' => 44,
                    'discrepancies_count' => 1,
                    'summary_notes' => 'Physical count underway. 1 workstation undergoing PSU maintenance.',
                ]);
            }
        }
    }
}
