import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ProjectService } from '../service/project.service';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { ProjectListResponse } from '../dto/project-list-response.dto';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { Project, ProjectStatus } from '@prisma/client';

@UseGuards(AuthGuard)
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async list(
    @Request() req,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('offset', ParseIntPipe) offset = 0,
    @Query('search') search?: string,
  ): Promise<{
    data: ProjectListResponse;
    total: number;
    size: number;
    offset: number;
    limit: number;
  }> {
    const userId = req.user.sub as number;

    const where = {
      userId,
      status: { not: ProjectStatus.archived },
      ...(search && {
        OR: [
          { name: { contains: search.toLowerCase() } },
          { url: { contains: search.toLowerCase() } },
        ],
      }),
    };

    const [list, total] = await this.projectService.findManyWithCount({
      where,
      skip: offset,
      take: limit,
    });

    return {
      data: list.map((x: Project) => ({
        id: x.id,
        name: x.name,
        url: x.url,
        status: x.status,
        expiredAt: x.expiredAt,
        createdAt: x.createdAt,
        updatedAt: x.updatedAt,
      })),
      total,
      size: list.length,
      offset,
      limit,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Body() dto: CreateProjectDto,
  ): Promise<Project> {
    const userId = req.user.sub as number;
    return this.projectService.create({
      ...dto,
      user: { connect: { id: userId } },
    });
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.projectService.update(id, dto);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    const project = await this.projectService.softDelete(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
  }
}
