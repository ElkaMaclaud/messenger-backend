import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, Repository } from 'typeorm';
import { User } from './user.entity/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  create(data: Partial<User>) {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  findByUsername(username: string) {
    return this.usersRepo.findOne({ where: { username } });
  }

  searchByUsername(
    query: string,
    excludeId: number,
  ): Promise<Pick<User, 'id' | 'username'>[]> {
    return this.usersRepo.find({
      where: {
        username: ILike(`%${query}%`),
        isActive: true,
        id: Not(excludeId),
      },
      select: ['id', 'username'],
      take: 20,
    });
  }
}
