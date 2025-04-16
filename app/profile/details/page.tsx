'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, Building, Calendar, GraduationCap, Briefcase, FileText, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const isEditMode = searchParams.get('edit') === 'true';

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch from profiles collection
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data());
        } else {
          toast.error('Profile not found');
        }
        
        // Fetch from users collection for name and createdAt
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Check profile completion and update status
  useEffect(() => {
    const updateProfileCompletion = async () => {
      if (!user || !profile || isUpdating) return;
      
      setIsUpdating(true);
      
      try {
        // Get fresh data from Firebase
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (!profileDoc.exists()) {
          toast.error('Profile not found');
          return;
        }
        
        const freshProfile = profileDoc.data();
        const profileData = freshProfile.chercheur || freshProfile.entreprise || {};
        
        // Check if all required fields are present in Firebase
        let isComplete = false;
        
        if (freshProfile.role === 'chercheur') {
          isComplete = !!(
            freshProfile.pays !== null &&
            freshProfile.ville !== null &&
            freshProfile.telephone !== null &&
            profileData.cv !== null &&
            profileData.formations !== null &&
            freshProfile.photoProfil !== null
          );
        } else if (freshProfile.role === 'company') {
          isComplete = !!(
            freshProfile.pays !== null &&
            freshProfile.ville !== null &&
            freshProfile.telephone !== null &&
            profileData.nomEntreprise !== null
          );
        }
        
        // Update profiles collection with the new status
        await updateDoc(doc(db, 'profiles', user.uid), {
          profileCompleted: isComplete ? 'yes' : 'no'
        });
        
        // Update local state with fresh data
        setProfile(freshProfile);
        
        if (isComplete) {
          toast.success('Profile marked as complete');
        }
      } catch (error) {
        console.error('Error updating profile completion:', error);
        toast.error('Failed to update profile status');
      } finally {
        setIsUpdating(false);
      }
    };
    
    updateProfileCompletion();
  }, [user, profile, isUpdating]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid gap-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!user || !profile || isEditMode) {
    return null; // Will redirect to login
  }

  // Extract data based on user role
  const profileData = profile.chercheur || profile.entreprise || {};
  const userRole = profile.role || 'chercheur';
  
  // Get location data directly from profile
  const pays = profile.pays || profileData.pays || 'Not provided';
  const ville = profile.ville || profileData.ville || 'Not provided';
  const telephone = profile.telephone || profileData.telephone || 'Not provided';
  
  // Get name from userData
  const userName = userData?.name || 'Not provided';
  
  // Get createdAt from userData
  const createdAt = userData?.createdAt || profile.createdAt;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Profile Information */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{userName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{telephone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">
                    {ville && pays 
                      ? `${ville}, ${pays}` 
                      : 'Not provided'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Account Type</p>
                  <p className="font-medium capitalize">{userRole}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">
                    {createdAt 
                      ? new Date(createdAt.seconds * 1000).toLocaleDateString() 
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education Card */}
          {userRole === 'chercheur' && profileData.formations && (
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
                <CardDescription>Your educational background</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileData.formations.map((formation: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <GraduationCap className="h-5 w-5 text-gray-500 mt-1" />
                    <div>
                      <p className="font-medium">{formation.diplome}</p>
                      <p className="text-sm text-gray-500">{formation.etablissement}</p>
                      <p className="text-sm text-gray-500">
                        {formation.anneeDebut} - {formation.anneeFin || 'Present'}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Documents Card */}
          {userRole === 'chercheur' && (
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Your uploaded documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileData.cv && (
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">CV</p>
                      <a 
                        href={profileData.cv} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View CV
                      </a>
                    </div>
                  </div>
                )}
                
                {profileData.liens && profileData.liens.length > 0 && (
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Links</p>
                      <div className="space-y-1">
                        {profileData.liens.map((lien: string, index: number) => (
                          <a 
                            key={index}
                            href={lien} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block text-blue-500 hover:underline"
                          >
                            {lien}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Completion Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
              <CardDescription>Your profile completion status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div 
                  className={`h-2.5 rounded-full ${
                    profile.profileCompleted === 'yes' 
                      ? 'bg-green-500' 
                      : 'bg-yellow-500'
                  }`} 
                  style={{ width: profile.profileCompleted === 'yes' ? '100%' : '50%' }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">
                {profile.profileCompleted === 'yes' 
                  ? 'Your profile is complete' 
                  : 'Your profile is incomplete. Click "Edit Profile" to complete it.'}
              </p>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                onClick={() => router.push('/profile')}
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 