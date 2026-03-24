import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    console.log(createUserDto.nonce);
    const checkAddress = await this.findUserByWalletAddress(createUserDto.wallet_address);
    if (checkAddress) {
      return { message: 'Wallet address đã tồn tại' };
    } else {
      const nonce: string = Math.floor(Math.random() * 1000000).toString();
      const createdUser = new this.userModel({
        ...createUserDto,
        nonce,
      });
      await createdUser.save();
      return { jwt: await this.createJWT(createUserDto.wallet_address, nonce) };
    }
  }

  async findUserByWalletAddress(wallet_address: string): Promise<User | null> {
    return await this.userModel.findOne({ wallet_address }).exec();
  }

  async createJWT(wallet_address: string, nonce: string): Promise<string> {
    const payload = { nonce, wallet_address };
    return await this.jwtService.signAsync(payload);
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
