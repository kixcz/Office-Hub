<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstitutionAuditLog extends Model
{
    protected $fillable = [
        'actor_user_id',
        'actor_name',
        'actor_role',
        'module',
        'action',
        'target_type',
        'target_name',
        'entity_scope',
        'college_scope',
        'scope_type',
        'scope_name',
        'severity',
        'previous_value',
        'new_value',
        'reason',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'previous_value' => 'array',
            'new_value' => 'array',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    public static function record(
        string $module,
        string $action,
        string $targetName,
        ?User $actor = null,
        ?array $previousValue = null,
        ?array $newValue = null,
        ?string $reason = null,
        string $severity = 'info',
        ?string $entityScope = null,
        ?string $collegeScope = null,
        ?string $targetType = null,
        ?string $scopeType = null,
        ?string $scopeName = null,
        ?string $actingRole = null,
    ): self {
        $activeRole = $actingRole ?? session('active_role_name') ?? $actor?->roles?->first()?->name ?? 'Institution Super Admin';
        $resolvedScopeType = $scopeType ?? session('active_scope_type') ?? ($collegeScope ? 'College' : ($entityScope ? 'Entity' : 'Institution'));
        $resolvedScopeName = $scopeName ?? session('active_scope_name') ?? $collegeScope ?? $entityScope ?? 'Institution';

        return static::create([
            'actor_user_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'Institution Super Admin',
            'actor_role' => $activeRole,
            'module' => $module,
            'action' => $action,
            'target_type' => $targetType,
            'target_name' => $targetName,
            'entity_scope' => $entityScope ?? ($resolvedScopeType === 'Entity' ? $resolvedScopeName : null),
            'college_scope' => $collegeScope ?? ($resolvedScopeType === 'College' ? $resolvedScopeName : null),
            'scope_type' => $resolvedScopeType,
            'scope_name' => $resolvedScopeName,
            'severity' => $severity,
            'previous_value' => $previousValue,
            'new_value' => $newValue,
            'reason' => $reason,
            'ip_address' => request()?->ip(),
        ]);
    }
}
