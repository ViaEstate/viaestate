import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Building, Users, Globe, Euro } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/contexts/LanguageContext'

interface KpisState {
  totalProperties: number
  countriesCount: number
  avgPrice: number | null
  loading: boolean
}

const HomeKpis = () => {
  const { t } = useLanguage();
  const [kpis, setKpis] = useState<KpisState>({
    totalProperties: 0,
    countriesCount: 0,
    avgPrice: null,
    loading: true,
  })

  useEffect(() => {
    const loadKpis = async () => {
      try {
        // Query counts in parallel
        const [propertiesRes, countriesRes, pricesRes] = await Promise.all([
          supabase
            .from('properties')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'published'),
          supabase
            .from('properties')
            .select('country')
            .eq('status', 'published'),
          supabase
            .from('properties')
            .select('price')
            .eq('status', 'published'),
        ])

        const totalProperties = propertiesRes.count ?? 0

        const countriesList = (countriesRes.data as { country: string | null }[] | null) || []
        const uniqueCountries = new Set(
          countriesList.filter((c) => !!c.country).map((c) => (c.country as string).trim())
        )

        const prices = (pricesRes.data as { price: number }[] | null) || []
        const avgPrice = prices.length
          ? Math.round(prices.reduce((sum, p) => sum + (p.price || 0), 0) / prices.length)
          : null

        setKpis({
          totalProperties,
          countriesCount: uniqueCountries.size,
          avgPrice,
          loading: false,
        })
      } catch (e) {
        console.error('Error loading KPIs', e)
        setKpis((prev) => ({ ...prev, loading: false }))
      }
    }

    loadKpis()
  }, [])

  const formatEUR = (value: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("kpis.properties")}</p>
                <p className="text-2xl font-bold">
                  {kpis.loading ? '—' : kpis.totalProperties}
                </p>
              </div>
            </CardContent>
          </Card>


          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("kpis.countries")}</p>
                <p className="text-2xl font-bold">
                  {kpis.loading ? '—' : kpis.countriesCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Euro className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("common.average_price", "Average Price")}</p>
                <p className="text-2xl font-bold">
                  {kpis.loading ? '—' : kpis.avgPrice !== null ? formatEUR(kpis.avgPrice) : '—'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

export default HomeKpis
