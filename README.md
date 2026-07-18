Working under the mentorship of Dr. Hai Le. I am making an agent-based simulation WebApp that is accessible to everyone.
This WebApp uses React.

## Private deployment

The Vercel deployment is protected by HTTP Basic Authentication in
`middleware.ts`. Before deploying, add a sensitive Vercel environment variable
named `SITE_PASSWORD` for the Production environment, then redeploy. The login
username is `emory`; the password is the value of `SITE_PASSWORD`.

If `SITE_PASSWORD` is missing, the deployed site fails closed with HTTP 503
instead of becoming public.
