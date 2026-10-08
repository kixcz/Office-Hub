<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RoomSchedule>
 */
class RoomScheduleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startHour = fake()->numberBetween(7, 16);

        return [
            'room_name' => 'CLR '.fake()->numberBetween(1, 5),
            'day_of_week' => fake()->randomElement(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
            'start_time' => sprintf('%02d:00:00', $startHour),
            'end_time' => sprintf('%02d:30:00', $startHour + 1),
            'course_code' => 'IT '.fake()->numberBetween(600, 650),
            'course_title' => fake()->words(3, true),
            'instructor' => strtoupper(fake()->lastName()),
            'section' => 'BSIT '.fake()->numberBetween(1, 4).fake()->randomElement(['A', 'B', 'C']),
            'raw_text' => null,
        ];
    }
}
