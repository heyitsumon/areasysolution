<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeUserAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:make-admin {email : The registered email address to promote}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Grant admin dashboard access to a registered user';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $user = User::query()
            ->where('email', mb_strtolower(trim((string) $this->argument('email'))))
            ->first();

        if ($user === null) {
            $this->error('No user exists with that email. Register the account first.');

            return self::FAILURE;
        }

        $user->forceFill(['is_admin' => true])->save();

        $this->info("Admin access granted to {$user->email}.");

        return self::SUCCESS;
    }
}
