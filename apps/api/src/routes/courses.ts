import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../storage/db';

const createCourseSchema = z.object({
  name: z.string().min(1),
});

export async function courseRoutes(fastify: FastifyInstance) {
  // Create course
  fastify.post('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const body = createCourseSchema.parse(request.body);
      const userId = (request.user as any).id;

      const course = await prisma.course.create({
        data: {
          name: body.name,
          ownerId: userId,
          memberships: {
            create: {
              userId,
              role: 'OWNER', // Creator gets OWNER role
            },
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return reply.status(201).send({ course });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get user's courses
  fastify.get('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).id;

      const courses = await prisma.course.findMany({
        where: {
          memberships: {
            some: {
              userId,
            },
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
          memberships: {
            where: {
              userId,
            },
            select: {
              role: true,
            },
          },
          _count: {
            select: {
              modules: true,
              memberships: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Add user's role to each course
      const coursesWithRole = courses.map(course => ({
        ...course,
        userRole: course.memberships[0]?.role || 'MEMBER',
        memberships: undefined, // Remove from response
      }));

      return reply.send({ courses: coursesWithRole });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get course by ID
  fastify.get('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const userId = (request.user as any).id;

      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Check if user is enrolled
      const isEnrolled = course.memberships.some((m) => m.userId === userId);

      if (!isEnrolled) {
        return reply.status(403).send({ error: 'Not enrolled in this course' });
      }

      return reply.send({ course });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get course modules
  fastify.get('/:id/modules', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const userId = (request.user as any).id;

      // Check if user is enrolled
      const membership = await prisma.courseMembership.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: id,
          },
        },
      });

      if (!membership) {
        return reply.status(403).send({ error: 'Not enrolled in this course' });
      }

      const modules = await prisma.module.findMany({
        where: {
          courseId: id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: true,
          versions: {
            orderBy: {
              versionNumber: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return reply.send({ modules });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Enroll in course (by URL param)
  fastify.post('/:id/enroll', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const userId = (request.user as any).id;

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Check if already enrolled
      const existingMembership = await prisma.courseMembership.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: id,
          },
        },
      });

      if (existingMembership) {
        return reply.status(409).send({ error: 'Already enrolled in this course' });
      }

      // Create membership
      const membership = await prisma.courseMembership.create({
        data: {
          userId,
          courseId: id,
        },
      });

      return reply.status(201).send({ 
        membership,
        message: 'Successfully joined course',
        course: {
          id: course.id,
          name: course.name,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Join course (by body courseId) - Alternative endpoint for easier frontend use
  fastify.post('/join', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { courseId } = request.body as any;
      const userId = (request.user as any).id;

      if (!courseId) {
        return reply.status(400).send({ error: 'Course ID is required' });
      }

      // Check if course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found. Please check the course ID.' });
      }

      // Check if already enrolled
      const existingMembership = await prisma.courseMembership.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: courseId,
          },
        },
      });

      if (existingMembership) {
        return reply.status(409).send({ error: 'You are already enrolled in this course' });
      }

      // Create membership
      const membership = await prisma.courseMembership.create({
        data: {
          userId,
          courseId: courseId,
        },
      });

      return reply.status(201).send({ 
        membership,
        message: `Successfully joined "${course.name}"!`,
        course: {
          id: course.id,
          name: course.name,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get course members (with roles)
  fastify.get('/:id/members', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const userId = (request.user as any).id;

      // Check if user is enrolled
      const membership = await prisma.courseMembership.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: id,
          },
        },
      });

      if (!membership) {
        return reply.status(403).send({ error: 'Not enrolled in this course' });
      }

      // Get all members with their roles
      const members = await prisma.courseMembership.findMany({
        where: {
          courseId: id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' }, // OWNER, ADMIN, MEMBER
          { createdAt: 'asc' },
        ],
      });

      return reply.send({ 
        members,
        currentUserRole: membership.role,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Update member role (OWNER and ADMIN only)
  fastify.patch('/:id/members/:memberId/role', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id, memberId } = request.params as any;
      const { role } = request.body as any;
      const userId = (request.user as any).id;

      // Validate role
      if (!['ADMIN', 'MEMBER'].includes(role)) {
        return reply.status(400).send({ error: 'Invalid role. Must be ADMIN or MEMBER' });
      }

      // Check if current user is OWNER or ADMIN
      const currentUserMembership = await prisma.courseMembership.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: id,
          },
        },
      });

      if (!currentUserMembership || !['OWNER', 'ADMIN'].includes(currentUserMembership.role)) {
        return reply.status(403).send({ error: 'Only owners and admins can change roles' });
      }

      // Get target member
      const targetMembership = await prisma.courseMembership.findUnique({
        where: {
          id: memberId,
        },
        include: {
          user: true,
        },
      });

      if (!targetMembership || targetMembership.courseId !== id) {
        return reply.status(404).send({ error: 'Member not found' });
      }

      // Cannot change OWNER role
      if (targetMembership.role === 'OWNER') {
        return reply.status(403).send({ error: 'Cannot change owner role' });
      }

      // ADMIN cannot change another ADMIN (only OWNER can)
      if (currentUserMembership.role === 'ADMIN' && targetMembership.role === 'ADMIN') {
        return reply.status(403).send({ error: 'Only the owner can change admin roles' });
      }

      // Update role
      const updated = await prisma.courseMembership.update({
        where: {
          id: memberId,
        },
        data: {
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return reply.send({ 
        member: updated,
        message: `${updated.user.name} is now ${role}`,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Update course
  fastify.put('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const { name } = request.body as any;
      const userId = (request.user as any).id;

      const course = await prisma.course.findUnique({
        where: { id },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Only owner can update
      if (course.ownerId !== userId) {
        return reply.status(403).send({ error: 'Not authorized' });
      }

      const updated = await prisma.course.update({
        where: { id },
        data: { name },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return reply.send({ course: updated });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Delete course
  fastify.delete('/:id', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params as any;
      const userId = (request.user as any).id;

      const course = await prisma.course.findUnique({
        where: { id },
      });

      if (!course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Only owner can delete
      if (course.ownerId !== userId) {
        return reply.status(403).send({ error: 'Not authorized' });
      }

      await prisma.course.delete({
        where: { id },
      });

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

