const prisma = require('../config/prisma');

const sanitize = (customer) => {
  if (!customer) return null;
  const { password, ...rest } = customer;
  return rest;
};

const Customer = {
  findByEmail: (email) =>
    prisma.customer.findUnique({ where: { email: email.toLowerCase().trim() } }),

  findById: async (id) => sanitize(await prisma.customer.findUnique({ where: { id: Number(id) } })),

  create: async (data) =>
    sanitize(
      await prisma.customer.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase().trim(),
          password: data.password,
          phone: data.phone || '',
          address: data.address || '',
          profileImage: data.profileImage || '',
        },
      })
    ),

  update: async (id, data) =>
    sanitize(
      await prisma.customer.update({
        where: { id: Number(id) },
        data: {
          ...(data.name != null && { name: data.name }),
          ...(data.phone != null && { phone: data.phone }),
          ...(data.address != null && { address: data.address }),
          ...(data.profileImage != null && { profileImage: data.profileImage }),
          ...(data.language != null && { language: data.language }),
          ...(data.idDocumentUrl != null && { idDocumentUrl: data.idDocumentUrl }),
          ...(data.password != null && { password: data.password }),
        },
      })
    ),
};

module.exports = Customer;
