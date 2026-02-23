import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/hooks/use-toast'

const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }

        if (data.session?.user) {
          // Check if user already has a profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create one with Google data
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.session.user.id,
                email: data.session.user.email!,
                full_name: data.session.user.user_metadata.full_name || data.session.user.email!.split('@')[0],
                role: 'private_user',
                status: 'pending'
              })

            if (insertError) throw insertError

            toast({
              title: "Account created!",
              description: "Your Google account is now registered and pending admin approval."
            })
          } else if (profileData) {
            toast({
              title: "Welcome back!",
              description: "You have successfully signed in with Google."
            })
          }
        }

        navigate('/')
      } catch (error: any) {
        console.error('Auth callback error:', error)
        toast({
          title: "Authentication failed",
          description: error.message,
          variant: "destructive"
        })
        navigate('/login')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}

export default AuthCallback