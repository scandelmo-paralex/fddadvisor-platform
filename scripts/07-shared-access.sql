-- Shared access table for team collaboration
CREATE TABLE IF NOT EXISTS public.shared_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchisor_id UUID NOT NULL REFERENCES public.franchisor_profiles(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(franchisor_id, shared_with_email)
);

-- Index for performance
CREATE INDEX idx_shared_access_email ON public.shared_access(shared_with_email);
CREATE INDEX idx_shared_access_franchisor ON public.shared_access(franchisor_id);

-- Enable RLS
ALTER TABLE public.shared_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Franchisors can manage their own shared access
CREATE POLICY "Franchisors can view own shared access" ON public.shared_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.franchisor_profiles
      WHERE franchisor_profiles.id = shared_access.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can manage own shared access" ON public.shared_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.franchisor_profiles
      WHERE franchisor_profiles.id = shared_access.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- Update leads policy to include shared access
DROP POLICY IF EXISTS "Franchisors can view franchise leads" ON public.leads;

CREATE POLICY "Franchisors can view franchise leads" ON public.leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.franchisor_profiles fp
      JOIN public.users u ON u.id = fp.user_id
      WHERE fp.id = leads.franchisor_id
      AND (
        u.id = auth.uid() -- Owner
        OR EXISTS ( -- Shared access
          SELECT 1 FROM public.shared_access sa
          WHERE sa.franchisor_id = fp.id
          AND sa.shared_with_email = u.email
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.shared_access sa
      JOIN public.users u ON u.email = sa.shared_with_email
      WHERE sa.franchisor_id = leads.franchisor_id
      AND u.id = auth.uid()
    )
  );
