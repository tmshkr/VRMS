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
    events: [Event]
  }

  type User {
    id: BigInt
    slack_id: String
    slack_team_id: String
    events: [Event]
    projects: [Project]
    real_name: String
    profile_image: String
    username: String
  }
  
  type Project {
    id: BigInt
    created_by_id: BigInt
    gcal_calendar_id: String
    events: [Event]
    name: String
    teamMembers: [User]
    slack_team_id: String
    slug: String
  }

  type Event {
    id: BigInt
    all_day: Boolean
    created_by_id: BigInt
    project: Project!
    project_id: BigInt
    recurrence: [String]
    slack_channel_id: String
    slack_team_id: String
    slug: String
    start_time: DateTime
    end_time: DateTime
    title: String
    description: String
    eventParticipants: [User]
  }
`;

const userSelect = {
  id: true,
  email: false,
  real_name: true,
  slack_id: true,
  slack_team_id: true,
  profile_image: true,
  username: true,
};

const resolvers = {
  Query: {
    users(parent, args, context) {
      return prisma.user.findMany({
        select: userSelect,
      });
    },
    projects(parent, args, context) {
      return prisma.project.findMany();
    },
    events(parent, args, context) {
      return prisma.event.findMany();
    },
  },

  User: {
    events(parent, args, context) {
      return prisma.eventParticipant
        .findMany({
          where: { user_id: parent.id },
          include: { event: true },
        })
        .then((data) => data.map(({ event }) => event));
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
    events(parent, args, context) {
      return prisma.event.findMany({
        where: { project_id: parent.id },
      });
    },
    teamMembers(parent, args, context) {
      return prisma.teamMember
        .findMany({
          where: { project_id: parent.id },
          include: {
            member: {
              select: userSelect,
            },
          },
        })
        .then((data) => {
          return data.map(({ member }) => member);
        });
    },
  },

  Event: {
    eventParticipants(parent, args, context) {
      return prisma.eventParticipant
        .findMany({
          where: { event_id: parent.id },
          include: {
            participant: {
              select: userSelect,
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
