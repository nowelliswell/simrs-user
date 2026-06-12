<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserToGroupUser extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'user_to_group_users';
    protected $fillable = [
        'nik_pegawai',
        'id_group',
        'is_leader',
    ];
}
