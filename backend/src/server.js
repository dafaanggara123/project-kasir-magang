import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';

import {
  createClient
} from '@supabase/supabase-js';

import { z } from 'zod';


/* =========================================================
   CONFIG
========================================================= */

const {
  PORT = 4000,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
} = process.env;

if (
  !SUPABASE_URL ||
  !SUPABASE_PUBLISHABLE_KEY
) {
  console.error(
    'SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY wajib diisi di backend/.env'
  );

  process.exit(1);
}


/* =========================================================
   EXPRESS
========================================================= */

const app = express();

app.use(
  helmet()
);

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(
  express.json({
    limit: '1mb'
  })
);

app.use(
  morgan('dev')
);


/* =========================================================
   MULTER
========================================================= */

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        3 * 1024 * 1024
    },

    fileFilter(
      req,
      file,
      cb
    ) {
      const allowed = [
        'image/jpeg',
        'image/png',
        'image/webp'
      ];

      if (
        !allowed.includes(
          file.mimetype
        )
      ) {
        return cb(
          new Error(
            'Format gambar harus JPG, PNG, atau WEBP.'
          )
        );
      }

      cb(
        null,
        true
      );
    }
  });


/* =========================================================
   SUPABASE
========================================================= */

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );


const db =
  (token) =>
    createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        global: {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        },

        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );


/* =========================================================
   ZOD SCHEMA
========================================================= */

const loginSchema =
  z.object({
    email:
      z.email(),

    password:
      z.string()
        .min(6)
  });


const signupSchema =
  z.object({
    fullName:
      z.string()
        .min(2)
        .max(80),

    email:
      z.email(),

    password:
      z.string()
        .min(6)
        .max(100)
  });


const profileSchema =
  z.object({
    fullName:
      z.string()
        .min(2)
        .max(80),

    phone:
      z.string()
        .max(30)
        .optional()
        .nullable(),

    address:
      z.string()
        .max(300)
        .optional()
        .nullable(),

    latitude:
      z.coerce
        .number()
        .min(-90)
        .max(90)
        .optional()
        .nullable(),

    longitude:
      z.coerce
        .number()
        .min(-180)
        .max(180)
        .optional()
        .nullable()
  });


/* =========================================================
   ORDER ITEM SCHEMA
========================================================= */

const orderItemSchema =
  z.object({
    menuId:
      z.coerce
        .number()
        .int()
        .positive(),

    quantity:
      z.coerce
        .number()
        .int()
        .min(1)
        .max(99),

    spiceLevel:
      z.enum([
        'tidak_pedas',
        'sedang',
        'pedas',
        'extra_pedas'
      ])
      .default(
        'sedang'
      ),

    notes:
      z.string()
        .max(200)
        .optional()
        .nullable()
  });


/* =========================================================
   CUSTOMER ORDER
========================================================= */

const orderSchema =
  z.object({
    customerName:
      z.string()
        .max(80)
        .optional()
        .nullable(),

    customerPhone:
      z.string()
        .max(30)
        .optional()
        .nullable(),

    address:
      z.string()
        .max(300)
        .optional()
        .nullable(),

    latitude:
      z.coerce
        .number()
        .min(-90)
        .max(90)
        .optional()
        .nullable(),

    longitude:
      z.coerce
        .number()
        .min(-180)
        .max(180)
        .optional()
        .nullable(),

    orderNotes:
      z.string()
        .max(300)
        .optional()
        .nullable(),

    paymentMethod:
      z.enum([
        'cash',
        'qris',
        'transfer'
      ]),

    items:
      z.array(
        orderItemSchema
      )
      .min(1)
  });


/* =========================================================
   MANUAL CASHIER ORDER
========================================================= */

const manualOrderSchema =
  orderSchema.extend({
    customerId:
      z.string()
        .uuid()
        .optional()
        .nullable(),

    paymentStatus:
      z.literal(
        'paid'
      )
      .default(
        'paid'
      )
  });


/* =========================================================
   MENU SCHEMA
========================================================= */

const menuSchema =
  z.object({
    categoryId:
      z.coerce
        .number()
        .int()
        .positive(),

    name:
      z.string()
        .min(2)
        .max(100),

    description:
      z.string()
        .max(500)
        .optional()
        .nullable(),

    price:
      z.coerce
        .number()
        .positive(),

    isActive:
      z.preprocess(
        (value) =>
          typeof value ===
          'boolean'
            ? value
            : String(value)
                .toLowerCase() ===
              'true',

        z.boolean()
      )
  });


/* =========================================================
   STATUS SCHEMA
========================================================= */

const statusSchema =
  z.object({
    status:
      z.enum([
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'completed',
        'cancelled'
      ])
  });


/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

async function auth(
  req,
  res,
  next
) {
  try {
    const token =
      (
        req.headers
          .authorization ||
        ''
      )
      .replace(
        /^Bearer\s+/i,
        ''
      )
      .trim();

    if (!token) {
      return res
        .status(401)
        .json({
          error:
            'Authentication diperlukan.'
        });
    }

    const {
      data: userData,
      error: userError
    } =
      await supabase.auth.getUser(
        token
      );

    if (
      userError ||
      !userData?.user
    ) {
      return res
        .status(401)
        .json({
          error:
            'Token tidak valid atau kadaluarsa.'
        });
    }

    const client =
      db(token);

    const {
      data: profile,
      error: profileError
    } =
      await client
        .from('profiles')
        .select(
          `
            id,
            full_name,
            phone,
            address,
            latitude,
            longitude,
            role,
            created_at
          `
        )
        .eq(
          'id',
          userData.user.id
        )
        .maybeSingle();

    if (
      profileError ||
      !profile
    ) {
      return res
        .status(403)
        .json({
          error:
            'Profil pengguna belum tersedia.',

          detail:
            profileError?.message ||
            null
        });
    }

    req.user =
      userData.user;

    req.profile =
      profile;

    req.db =
      client;

    req.token =
      token;

    next();

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   ROLE
========================================================= */

const allow =
  (...roles) =>
  (
    req,
    res,
    next
  ) => {
    if (
      !roles.includes(
        req.profile?.role
      )
    ) {
      return res
        .status(403)
        .json({
          error:
            'Role tidak memiliki akses.'
        });
    }

    next();
  };


/* =========================================================
   AUDIT
========================================================= */

const audit =
  async (
    req,
    action,
    entity,
    entity_id,
    meta = {}
  ) => {

    const {
      error
    } =
      await req.db
        .from(
          'audit_logs'
        )
        .insert({
          actor_id:
            req.user.id,

          action,

          entity,

          entity_id,

          meta
        });

    if (error) {
      console.error(
        'Audit log error:',
        error
      );
    }
  };


/* =========================================================
   HEALTH
========================================================= */

app.get(
  '/api/health',
  (
    req,
    res
  ) => {
    res.json({
      ok: true,
      service:
        'geprekflow-project-1',
      time:
        new Date()
          .toISOString()
    });
  }
);


/* =========================================================
   LOGIN
========================================================= */

app.post(
  '/api/auth/login',

  async (
    req,
    res,
    next
  ) => {
    try {

      const parsed =
        loginSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error:
              'Email atau password tidak valid.'
          });
      }

      const {
        data,
        error
      } =
        await supabase.auth
          .signInWithPassword(
            parsed.data
          );

      if (error) {
        return res
          .status(401)
          .json({
            error:
              error.message
          });
      }

      const client =
        db(
          data.session
            .access_token
        );

      const {
        data: profile,
        error: profileError
      } =
        await client
          .from(
            'profiles'
          )
          .select(
            `
              id,
              full_name,
              phone,
              address,
              latitude,
              longitude,
              role,
              created_at
            `
          )
          .eq(
            'id',
            data.user.id
          )
          .single();

      if (
        profileError ||
        !profile
      ) {
        return res
          .status(403)
          .json({
            error:
              'Profil pengguna belum tersedia.',

            detail:
              profileError?.message ||
              null
          });
      }

      res.json({
        session:
          data.session,

        user:
          data.user,

        profile
      });

    } catch (error) {
      next(error);
    }
  }
);


/* =========================================================
   REGISTER
========================================================= */

app.post(
  '/api/auth/signup',

  async (
    req,
    res,
    next
  ) => {
    try {

      const parsed =
        signupSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error:
              'Data registrasi tidak valid.'
          });
      }

      const {
        data,
        error
      } =
        await supabase.auth
          .signUp({
            email:
              parsed.data.email,

            password:
              parsed.data.password,

            options: {
              data: {
                full_name:
                  parsed.data
                    .fullName
              }
            }
          });

      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }

      res
        .status(201)
        .json({

          session:
            data.session,

          user:
            data.user,

          message:
            data.session
              ? 'Registrasi berhasil.'
              : 'Registrasi berhasil. Periksa email jika verifikasi diaktifkan.'
        });

    } catch (error) {
      next(error);
    }
  }
);


/* =========================================================
   CURRENT USER
========================================================= */

app.get(
  '/api/me',
  auth,
  (
    req,
    res
  ) => {

    res.json({

      user: {
        id:
          req.user.id,

        email:
          req.user.email
      },

      profile:
        req.profile
    });

  }
);


/* =========================================================
   CUSTOMER PROFILE
========================================================= */

app.put(
  '/api/profile',
  auth,
  allow('customer'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const parsed =
        profileSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error:
              'Data profil tidak valid.',

            details:
              parsed.error.flatten()
          });
      }

      const {
        data,
        error
      } =
        await req.db
          .from(
            'profiles'
          )
          .update({
            full_name:
              parsed.data.fullName,

            phone:
              parsed.data.phone ||
              null,

            address:
              parsed.data.address ||
              null,

            latitude:
              parsed.data.latitude ??
              null,

            longitude:
              parsed.data.longitude ??
              null
          })
          .eq(
            'id',
            req.user.id
          )
          .select(
            `
              id,
              full_name,
              phone,
              address,
              latitude,
              longitude,
              role,
              created_at
            `
          )
          .single();

      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }

      res.json(
        data
      );

    } catch (error) {
      next(error);
    }
  }
);


/* =========================================================
   CATEGORIES
========================================================= */

app.get(
  '/api/categories',
  auth,

  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        data,
        error
      } =
        await req.db
          .from(
            'categories'
          )
          .select(
            'id,name'
          )
          .order(
            'name'
          );

      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }

      res.json(
        data || []
      );

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   CUSTOMER MENU
========================================================= */

app.get(
  '/api/menu',
  auth,

  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        data,
        error
      } =
        await req.db
          .from(
            'menu'
          )
          .select(`
            id,
            category_id,
            name,
            description,
            price,
            image_url,
            is_active,
            categories(
              id,
              name
            )
          `)
          .eq(
            'is_active',
            true
          )
          .order(
            'name'
          );

      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }

      res.json(
        data || []
      );

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   CASHIER MENU
========================================================= */

app.get(
  '/api/cashier/menu',
  auth,
  allow('cashier'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        data,
        error
      } =
        await req.db
          .from(
            'menu'
          )
          .select(`
            id,
            category_id,
            name,
            description,
            price,
            image_url,
            is_active,
            categories(
              id,
              name
            )
          `)
          .order(
            'id',
            {
              ascending:
                false
            }
          );

      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }

      res.json(
        data || []
      );

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   SAVE MENU
========================================================= */

async function saveMenu(
  req,
  res,
  id = null
) {

  const parsed =
    menuSchema.safeParse(
      req.body
    );

  if (!parsed.success) {
    return res
      .status(400)
      .json({
        error:
          'Data menu tidak valid.',

        details:
          parsed.error.flatten()
      });
  }

  const {
    categoryId,
    name,
    description,
    price,
    isActive
  } =
    parsed.data;


  const {
    data: category
  } =
    await req.db
      .from(
        'categories'
      )
      .select(
        'id'
      )
      .eq(
        'id',
        categoryId
      )
      .maybeSingle();


  if (!category) {
    return res
      .status(400)
      .json({
        error:
          'Kategori tidak ditemukan.'
      });
  }


  let image_url =
    null;


  if (id) {
    const {
      data: oldMenu
    } =
      await req.db
        .from(
          'menu'
        )
        .select(
          'image_url'
        )
        .eq(
          'id',
          id
        )
        .maybeSingle();

    image_url =
      oldMenu?.image_url ||
      null;
  }


  if (req.file) {

    const ext =
      (
        req.file
          .originalname
          .split('.')
          .pop() ||
        'jpg'
      )
      .toLowerCase();


    const allowedExt = [
      'jpg',
      'jpeg',
      'png',
      'webp'
    ];


    const safeExt =
      allowedExt.includes(
        ext
      )
        ? ext
        : 'jpg';


    const path =
      `menu/menu-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${safeExt}`;


    const {
      error: uploadError
    } =
      await req.db.storage
        .from(
          'menu-images'
        )
        .upload(
          path,
          req.file.buffer,
          {
            contentType:
              req.file.mimetype,

            upsert:
              false
          }
        );


    if (uploadError) {
      return res
        .status(400)
        .json({
          error:
            'Gagal mengupload gambar.',

          detail:
            uploadError.message
        });
    }


    image_url =
      req.db.storage
        .from(
          'menu-images'
        )
        .getPublicUrl(
          path
        )
        .data
        .publicUrl;
  }


  const payload = {
    category_id:
      categoryId,

    name:
      name.trim(),

    description:
      description ||
      null,

    price,

    image_url,

    is_active:
      isActive,

    updated_at:
      new Date()
        .toISOString()
  };


  const query =
    id
      ? req.db
          .from(
            'menu'
          )
          .update(
            payload
          )
          .eq(
            'id',
            id
          )
      : req.db
          .from(
            'menu'
          )
          .insert(
            payload
          );


  const {
    data,
    error
  } =
    await query
      .select(`
        id,
        category_id,
        name,
        description,
        price,
        image_url,
        is_active,
        categories(
          id,
          name
        )
      `)
      .single();


  if (error) {
    return res
      .status(400)
      .json({
        error:
          error.message
      });
  }


  await audit(
    req,
    id
      ? 'UPDATE_MENU'
      : 'CREATE_MENU',
    'menu',
    data.id,
    {
      name:
        data.name,

      price:
        data.price
    }
  );


  return res
    .status(
      id
        ? 200
        : 201
    )
    .json(
      data
    );
}


/* =========================================================
   CREATE MENU
========================================================= */

app.post(
  '/api/cashier/menu',
  auth,
  allow('cashier'),
  upload.single('image'),

  (
    req,
    res,
    next
  ) =>
    saveMenu(
      req,
      res
    ).catch(
      next
    )
);


/* =========================================================
   UPDATE MENU
========================================================= */

app.put(
  '/api/cashier/menu/:id',
  auth,
  allow('cashier'),
  upload.single('image'),

  (
    req,
    res,
    next
  ) =>
    saveMenu(
      req,
      res,
      Number(
        req.params.id
      )
    ).catch(
      next
    )
);


/* =========================================================
   TOGGLE MENU STATUS
========================================================= */

app.patch(
  '/api/cashier/menu/:id/status',
  auth,
  allow('cashier'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const id =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(id)
      ) {
        return res
          .status(400)
          .json({
            error:
              'ID menu tidak valid.'
          });
      }


      const isActive =
        Boolean(
          req.body?.isActive
        );


      const {
        data,
        error
      } =
        await req.db
          .from(
            'menu'
          )
          .update({
            is_active:
              isActive,

            updated_at:
              new Date()
                .toISOString()
          })
          .eq(
            'id',
            id
          )
          .select(`
            id,
            category_id,
            name,
            description,
            price,
            image_url,
            is_active,
            categories(
              id,
              name
            )
          `)
          .single();


      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }


      await audit(
        req,
        'TOGGLE_MENU',
        'menu',
        data.id,
        {
          is_active:
            data.is_active
        }
      );


      res.json(
        data
      );

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   MENU MAP
   + CATEGORY
========================================================= */

async function menuMap(
  dbClient,
  items
) {

  const ids =
    [
      ...new Set(
        items.map(
          (x) =>
            x.menuId
        )
      )
    ];


  const {
    data,
    error
  } =
    await dbClient
      .from(
        'menu'
      )
      .select(`
        id,
        name,
        price,
        is_active,
        categories(
          id,
          name
        )
      `)
      .in(
        'id',
        ids
      );


  if (error) {
    throw new Error(
      error.message
    );
  }


  const map =
    new Map(
      (
        data || []
      ).map(
        (m) => [
          m.id,
          m
        ]
      )
    );


  for (
    const item
    of items
  ) {

    const menu =
      map.get(
        item.menuId
      );


    if (!menu) {
      throw new Error(
        `Menu ID ${item.menuId} tidak ditemukan.`
      );
    }


    if (
      !menu.is_active
    ) {
      throw new Error(
        `Menu "${menu.name}" sedang tidak tersedia.`
      );
    }
  }


  return map;
}


/* =========================================================
   CUSTOMER CREATE ORDER
========================================================= */

app.post(
  '/api/orders',
  auth,
  allow('customer'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const parsed =
        orderSchema.safeParse(
          req.body
        );


      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error:
              'Data checkout tidak valid.',

            details:
              parsed.error.flatten()
          });
      }


      const {
        customerName,
        customerPhone,
        address,
        latitude,
        longitude,
        orderNotes,
        paymentMethod,
        items
      } =
        parsed.data;


      const map =
        await menuMap(
          req.db,
          items
        );


      const {
        data: order,
        error: orderError
      } =
        await req.db
          .from(
            'orders'
          )
          .insert({
            customer_id:
              req.user.id,

            customer_name:
              customerName ||
              req.profile
                .full_name,

            customer_phone:
              customerPhone ||
              req.profile
                .phone ||
              null,

            address:
              address ||
              req.profile
                .address ||
              null,

            latitude:
              latitude ??
              req.profile
                .latitude ??
              null,

            longitude:
              longitude ??
              req.profile
                .longitude ??
              null,

            order_notes:
              orderNotes ||
              null,

            payment_method:
              paymentMethod,

            payment_status:
              'pending',

            status:
              'pending',

            total:
              0
          })
          .select(`
            id,
            order_code,
            customer_id,
            customer_name,
            customer_phone,
            address,
            latitude,
            longitude,
            order_notes,
            total,
            payment_method,
            payment_status,
            status,
            ordered_at
          `)
          .single();


      if (orderError) {
        return res
          .status(400)
          .json({
            error:
              orderError.message
          });
      }


      const orderItems =
        items.map(
          (item) => {

            const menu =
              map.get(
                item.menuId
              );

            const isAyamGeprek =
              menu
                ?.categories
                ?.name ===
              'Ayam Geprek';


            return {
              order_id:
                order.id,

              menu_id:
                item.menuId,

              quantity:
                item.quantity,

              unit_price:
                menu.price,

              spice_level:
                isAyamGeprek
                  ? (
                      item.spiceLevel ||
                      'sedang'
                    )
                  : 'sedang',

              notes:
                null
            };
          }
        );


      const {
        error: itemError
      } =
        await req.db
          .from(
            'order_items'
          )
          .insert(
            orderItems
          );


      if (itemError) {
        return res
          .status(400)
          .json({
            error:
              itemError.message
          });
      }


 /* =========================================================
   HITUNG TOTAL TRANSAKSI MANUAL
========================================================= */

const total =
  orderItems.reduce(
    (sum, item) =>
      sum +
      (
        Number(
          item.unit_price
        ) *
        Number(
          item.quantity
        )
      ),
    0
  );


const {
  error: updateTotalError
} =
  await req.db
    .from('orders')
    .update({
      total,
      status:
        'completed',
      payment_status:
        'paid',
      cashier_id:
        req.user.id,
      updated_at:
        new Date().toISOString()
    })
    .eq(
      'id',
      order.id
    );


if (
  updateTotalError
) {
  return res
    .status(400)
    .json({
      error:
        updateTotalError.message
    });
}


      await audit(
        req,
        'CREATE_ORDER',
        'orders',
        order.id,
        {
          total,
          source:
            'customer'
        }
      );


      res
        .status(201)
        .json({
          ...order,
          total
        });

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   CUSTOMER ORDER HISTORY
========================================================= */

app.get(
  '/api/my/orders',
  auth,
  allow('customer'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        data,
        error
      } =
        await req.db
          .from(
            'orders'
          )
          .select(`
            id,
            order_code,
            customer_name,
            customer_phone,
            address,
            latitude,
            longitude,
            order_notes,
            total,
            payment_method,
            payment_status,
            status,
            ordered_at,
            updated_at,

            order_items(
              id,
              quantity,
              unit_price,
              spice_level,
              notes,

              menu(
                id,
                name,
                image_url,

                categories(
                  id,
                  name
                )
              )
            )
          `)
          .eq(
            'customer_id',
            req.user.id
          )
          .order(
            'ordered_at',
            {
              ascending:
                false
            }
          )
          .limit(
            100
          );


      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }


      res.json(
        data || []
      );

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   CASHIER MANUAL ORDER
========================================================= */

app.post(
  '/api/cashier/orders',
  auth,
  allow('cashier'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const body = {
        ...req.body,

        paymentStatus:
          'paid'
      };


      const parsed =
        manualOrderSchema.safeParse(
          body
        );


      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error:
              'Data transaksi manual tidak valid.',

            details:
              parsed.error.flatten()
          });
      }


      const {
        customerId,
        customerName,
        customerPhone,
        address,
        latitude,
        longitude,
        orderNotes,
        paymentMethod,
        items
      } =
        parsed.data;


      const map =
        await menuMap(
          req.db,
          items
        );


      const {
        data: order,
        error: orderError
      } =
        await req.db
          .from(
            'orders'
          )
          .insert({
            customer_id:
              customerId ||
              null,

            cashier_id:
              req.user.id,

            customer_name:
              customerName ||
              'Pelanggan Offline',

            customer_phone:
              customerPhone ||
              null,

            address:
              address ||
              null,

            latitude:
              latitude ??
              null,

            longitude:
              longitude ??
              null,

            order_notes:
              orderNotes ||
              null,

            payment_method:
              paymentMethod,

            /*
             * Manual:
             * transaksi langsung selesai
             * dan pembayaran langsung lunas.
             */
            payment_status:
              'paid',

            status:
              'completed',

            total:
              0
          })
          .select(`
            id,
            order_code,
            customer_name,
            customer_phone,
            address,
            order_notes,
            total,
            payment_method,
            payment_status,
            status,
            ordered_at
          `)
          .single();


      if (orderError) {
        return res
          .status(400)
          .json({
            error:
              orderError.message
          });
      }


      const orderItems =
        items.map(
          (item) => {

            const menu =
              map.get(
                item.menuId
              );

            const isAyamGeprek =
              menu
                ?.categories
                ?.name ===
              'Ayam Geprek';


            return {
              order_id:
                order.id,

              menu_id:
                item.menuId,

              quantity:
                item.quantity,

              unit_price:
                menu.price,

              spice_level:
                isAyamGeprek
                  ? (
                      item.spiceLevel ||
                      'sedang'
                    )
                  : 'sedang',

              notes:
                null
            };
          }
        );


      const {
        error: itemError
      } =
        await req.db
          .from(
            'order_items'
          )
          .insert(
            orderItems
          );


      if (itemError) {
        return res
          .status(400)
          .json({
            error:
              itemError.message
          });
      }


      const {
        data: total,
        error: totalError
      } =
        await req.db.rpc(
          'recalc_order_total',
          {
            p_order_id:
              order.id
          }
        );


      if (totalError) {
        return res
          .status(400)
          .json({
            error:
              totalError.message
          });
      }


      /*
       * Pastikan transaksi manual
       * tetap lunas setelah RPC.
       */
      await req.db
        .from(
          'orders'
        )
        .update({
          status:
            'completed',

          payment_status:
            'paid',

          cashier_id:
            req.user.id,

          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          'id',
          order.id
        );


      await audit(
        req,
        'CREATE_MANUAL_ORDER',
        'orders',
        order.id,
        {
          total,
          source:
            'cashier'
        }
      );


      res
        .status(201)
        .json({
          ...order,

          total,

          status:
            'completed',

          payment_status:
            'paid'
        });

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   CASHIER ORDERS
========================================================= */

app.get(
  '/api/cashier/orders',
  auth,
  allow('cashier'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        data,
        error
      } =
        await req.db
          .from(
            'orders'
          )
          .select(`
            id,
            order_code,
            customer_id,
            customer_name,
            customer_phone,
            address,
            latitude,
            longitude,
            order_notes,
            total,
            payment_method,
            payment_status,
            status,
            ordered_at,
            updated_at,

            order_items(
              id,
              quantity,
              unit_price,
              spice_level,
              notes,

              menu(
                id,
                name,
                image_url,

                categories(
                  id,
                  name
                )
              )
            )
          `)
          .order(
            'ordered_at',
            {
              ascending:
                false
            }
          )
          .limit(
            200
          );


      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }


      /*
       * Sinkronisasi tampilan pembayaran
       * dengan status pesanan.
       *
       * completed = paid
       * lainnya   = pending
       */
      const normalized =
        (data || [])
          .map(
            (order) => ({
              ...order,

              payment_status:
                order.status ===
                'completed'
                  ? 'paid'
                  : 'pending'
            })
          );


      res.json(
        normalized
      );

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

app.patch(
  '/api/cashier/orders/:id/status',
  auth,
  allow('cashier'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const parsed =
        statusSchema.safeParse(
          req.body
        );


      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error:
              'Status pesanan tidak valid.'
          });
      }


      const id =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(id)
      ) {
        return res
          .status(400)
          .json({
            error:
              'ID pesanan tidak valid.'
          });
      }


      const newStatus =
        parsed.data.status;


      /*
       * RULE:
       *
       * completed -> paid
       * selain completed -> pending
       */
      const paymentStatus =
        newStatus ===
        'completed'
          ? 'paid'
          : 'pending';


      const {
        data,
        error
      } =
        await req.db
          .from(
            'orders'
          )
          .update({

            status:
              newStatus,

            payment_status:
              paymentStatus,

            cashier_id:
              req.user.id,

            updated_at:
              new Date()
                .toISOString()
          })
          .eq(
            'id',
            id
          )
          .select(`
            id,
            order_code,
            customer_name,
            customer_phone,
            address,
            order_notes,
            total,
            payment_method,
            payment_status,
            status,
            ordered_at,
            updated_at,

            order_items(
              id,
              quantity,
              unit_price,
              spice_level,
              notes,

              menu(
                id,
                name,
                image_url,

                categories(
                  id,
                  name
                )
              )
            )
          `)
          .single();


      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }


      await audit(
        req,
        'UPDATE_ORDER_STATUS',
        'orders',
        data.id,
        {
          status:
            data.status,

          payment_status:
            data.payment_status
        }
      );


      res.json(
        data
      );

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   CASHIER DASHBOARD
========================================================= */

app.get(
  '/api/cashier/dashboard',
  auth,
  allow('cashier'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const start =
        new Date();

      start.setHours(
        0,
        0,
        0,
        0
      );


      const {
        data,
        error
      } =
        await req.db
          .from(
            'orders'
          )
          .select(`
            id,
            total,
            status,
            payment_status,
            ordered_at
          `)
          .gte(
            'ordered_at',
            start.toISOString()
          );


      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }


      const orders =
        data || [];


      /*
       * Untuk dashboard:
       * payment_status dihitung berdasarkan
       * status pesanan supaya konsisten.
       */
      const normalized =
        orders.map(
          (order) => ({
            ...order,

            payment_status:
              order.status ===
              'completed'
                ? 'paid'
                : 'pending'
          })
        );


      res.json({

        totalOrders:
          normalized.length,


        pendingOrders:
          normalized.filter(
            (order) =>
              order.status ===
              'pending'
          ).length,


        preparingOrders:
          normalized.filter(
            (order) =>
              [
                'confirmed',
                'preparing'
              ].includes(
                order.status
              )
          ).length,


        readyOrders:
          normalized.filter(
            (order) =>
              order.status ===
              'ready'
          ).length,


        completedOrders:
          normalized.filter(
            (order) =>
              order.status ===
              'completed'
          ).length,


        paidOrders:
          normalized.filter(
            (order) =>
              order.status ===
              'completed'
          ).length,


        omzetToday:
          normalized
            .filter(
              (order) =>
                order.status !==
                'cancelled'
            )
            .reduce(
              (
                sum,
                order
              ) =>
                sum +
                Number(
                  order.total ||
                  0
                ),
              0
            )
      });

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   GLOBAL ERROR
========================================================= */

app.use(
  (
    err,
    req,
    res,
    next
  ) => {

    console.error(
      'GLOBAL ERROR:',
      err
    );


    if (
      res.headersSent
    ) {
      return next(
        err
      );
    }


    res
      .status(500)
      .json({
        error:
          err.message ||
          'Internal server error.'
      });

  }
);


/* =========================================================
   SERVER
========================================================= */

app.listen(
  PORT,
  () => {

    console.log(
      `Project 1 backend http://localhost:${PORT}`
    );

  }
);