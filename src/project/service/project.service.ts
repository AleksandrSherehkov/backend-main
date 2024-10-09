import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma';
import { Prisma, Project, ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(private readonly prismaService: PrismaService) {}

  async findManyWithCount(
    args: Prisma.ProjectFindManyArgs,
  ): Promise<[Project[], number]> {
    const list = await this.prismaService.project.findMany(args);
    const total = await this.prismaService.project.count({ where: args.where });
    return [list, total];
  }

  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return this.prismaService.project.create({ data });
  }

  async update(
    id: number,
    data: Prisma.ProjectUpdateInput,
  ): Promise<Project | null> {
    try {
      return await this.prismaService.project.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }
      throw error;
    }
  }

  async softDelete(id: number): Promise<Project | null> {
    try {
      return await this.prismaService.project.update({
        where: { id },
        data: { status: ProjectStatus.archived },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }
      throw error;
    }
  }
}
