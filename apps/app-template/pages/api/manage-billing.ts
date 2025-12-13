import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { stripe } from '../../../utils/stripe';
import { getURL } from '../../../utils/helpers';
import { createOrRetrieveCustomer } from '../../../utils/supabase-admin';

const manageBilling = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      const session = await getSession({ req });
      if (!session) throw new Error('Could not get user session');
      const user = session.user;

      if (!user) throw new Error('Could not get user');
      const customer = await createOrRetrieveCustomer({
        uuid: user.id as string,
        email: user.email as string,
      });

      if (!customer) throw new Error('Could not get customer');
      const { url } = await stripe.billingPortal.sessions.create({
        customer,
        return_url: `${getURL()}/account`,
      });

      return res.status(200).json({ url });
    } catch (err: any) {
      console.log(err);
      return res.status(500).json({ error: { statusCode: 500, message: err.message } });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
};

export default manageBilling;