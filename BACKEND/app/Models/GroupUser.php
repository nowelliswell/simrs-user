<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupUser extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'group_users';
    protected $fillable = [
        'nama_group'
    ];

    public function userToGroupUsers()
    {
        return $this->hasMany(UserToGroupUser::class, 'id_group', 'id');
    }
}
