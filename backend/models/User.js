const prisma = require('../config/prisma');

const User = {
  findByEmail: (email) =>
    prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } }),

  findById: (id) => prisma.user.findUnique({ where: { id: Number(id) } }),

  create: (data) =>
    prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        password: data.password,
        role: data.role || 'user',
      },
    }),
};

module.exports = User;
