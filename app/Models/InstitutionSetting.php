<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstitutionSetting extends Model
{
    protected $fillable = [
        'key',
        'group',
        'value',
        'type',
        'label',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'json',
        ];
    }

    public static function getVal(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        if (! $setting) {
            return $default;
        }

        return $setting->value ?? $default;
    }

    public static function setVal(string $key, $value, string $group = 'general', ?string $label = null)
    {
        return static::updateOrCreate(
            ['key' => $key],
            [
                'group' => $group,
                'value' => $value,
                'label' => $label ?? ucwords(str_replace('_', ' ', $key)),
            ]
        );
    }
}
