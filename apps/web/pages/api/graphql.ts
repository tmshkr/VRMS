(BigInt as any).prototype.toJSON = function () {
  return this.toString();
};
import { createServer } from "@graphql-yoga/node";
import prisma from "common/prisma";

const typeDefs = `
  scalar DateTime
  scalar BigInt

  type Query {
    users: [User]
    projects: [Project]
    meetings: [Meeting]
  }

  type User {
    id: BigInt
    slack_id: String
    meetings: [Meeting]
    projects: [Project]
    real_name: String
  }
  
  type Project {
    id: BigInt
    created_by: String
    is_active: Boolean
    meetings: [Meeting]
    name: String
    teamMembers: [User]
  }

  type Meeting {
    id: BigInt
    created_by: String
    is_active: Boolean
    project: Project!
    project_id: BigInt
    rrule: String
    slack_channel_id: String
    start_time: DateTime
    end_time: DateTime
    title: String
    description: String
    meetingParticipants: [User]
  }
`;

const resolvers = {
  Query: {
    users(parent, args, context) {
      return prisma.user.findMany({
        select: {
          id: true,
          email: false,
          real_name: true,
          slack_id: true,
        },
      });
    },
    projects(parent, args, context) {
      return prisma.project.findMany();
    },
    meetings(parent, args, context) {
      return prisma.meeting.findMany();
    },
  },

  User: {
    meetings(parent, args, context) {
      return prisma.meetingParticipant
        .findMany({
          where: { user_id: parent.id },
          include: { meeting: true },
        })
        .then((data) => data.map(({ meeting }) => meeting));
    },
    projects(parent, args, context) {
      return prisma.teamMember
        .findMany({
          where: { user_id: parent.id },
          include: { project: true },
        })
        .then((data) => data.map(({ project }) => project));
    },
  },

  Project: {
    meetings(parent, args, context) {
      return prisma.meeting.findMany({
        where: { project_id: parent.id },
      });
    },
    teamMembers(parent, args, context) {
      return prisma.teamMember
        .findMany({
          where: { project_id: parent.id },
          include: {
            member: {
              select: {
                id: true,
                email: false,
                real_name: true,
                slack_id: true,
              },
            },
          },
        })
        .then((data) => {
          return data.map(({ member }) => member);
        });
    },
  },

  Meeting: {
    meetingParticipants(parent, args, context) {
      return prisma.meetingParticipant
        .findMany({
          where: { meeting_id: parent.id },
          include: {
            participant: {
              select: {
                id: true,
                email: false,
                real_name: true,
                slack_id: true,
              },
            },
          },
        })
        .then((data) => {
          return data.map(({ participant }) => participant);
        });
    },
    project(parent, args, context) {
      return prisma.project.findUnique({ where: { id: parent.project_id } });
    },
  },
};

const server = createServer({
  schema: {
    typeDefs,
    resolvers,
  },
  endpoint: "/api/graphql",
  graphiql: true,
});

export default server;
