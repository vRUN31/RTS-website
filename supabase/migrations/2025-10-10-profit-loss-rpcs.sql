-- Create sample RPCs for profit/loss aggregation if not present
-- Note: Adjust SQL to your actual schema & column names

-- profit_loss_by_month: returns { labels: text[], values: numeric[] }
create or replace function public.profit_loss_by_month()
returns table(label text, value numeric)
language sql stable
as $$
  select to_char(date_trunc('month', created_at), 'Mon YYYY') as label, coalesce(sum(cost),0) - coalesce(sum(operational_cost),0) as value
  from public.shipments
  where created_at is not null
  group by 1
  order by min(created_at) desc
  limit 12;
$$;

-- profit_loss_by_week
create or replace function public.profit_loss_by_week()
returns table(label text, value numeric)
language sql stable
as $$
  select to_char(date_trunc('week', created_at), 'IYYY-IW') as label, coalesce(sum(cost),0) - coalesce(sum(operational_cost),0) as value
  from public.shipments
  group by 1
  order by min(created_at) desc
  limit 12;
$$;

-- profit_loss_by_year
create or replace function public.profit_loss_by_year()
returns table(label text, value numeric)
language sql stable
as $$
  select to_char(date_trunc('year', created_at), 'YYYY') as label, coalesce(sum(cost),0) - coalesce(sum(operational_cost),0) as value
  from public.shipments
  group by 1
  order by min(created_at) desc
  limit 12;
$$;
