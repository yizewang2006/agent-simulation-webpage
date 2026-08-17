## About this Project
Agent Simulation Project is a browser-based platform for creating and running agent-based simulations. The project aims to make agent-based simulation more accessible by providing visual tools for creating entities, configuring behaviors, running simulations, and reviewing results.

## Authors
- **Yize (Kevin) Wang** — Student, Emory University
- **Hanyi (Elaine) Ding** — Student, Emory University

## Mentor
- **Dr. Hai Le** — Assistant Professor, Oxford College of Emory University

## Main Features
- Create and edit simulation agents
- Create circular and polygonal obstacles
- Build reusable agent behaviors
- Configure Action and Activation Filters
- Select target entity types
- Run and pause simulations
- Create, restore, rename, and delete snapshots
- Record and replay simulations
- Import and export scenarios
- Build scenarios visually

## Technology
- React
- Vite
- JavaScript
- HTML Canvas
- React Router
- Lucide React

## Under Development
- Scenario Builder UI Overhauling

## Private deployment

The Vercel deployment is protected by HTTP Basic Authentication in
`middleware.ts`. Before deploying, add a sensitive Vercel environment variable
named `SITE_PASSWORD` for the Production environment, then redeploy. The login
username is `emory`; the password is the value of `SITE_PASSWORD`.

If `SITE_PASSWORD` is missing, the deployed site fails closed with HTTP 503
instead of becoming public.
