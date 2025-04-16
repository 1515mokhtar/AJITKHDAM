'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ProfilChercheur } from '@/types/profile';
import { useStorage } from '@/hooks/use-storage';
import { Plus, Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const formSchema = z.object({
  telephone: z.string().min(10, 'Le numéro de téléphone doit contenir au moins 10 caractères'),
  ville: z.string().min(2, 'La ville doit contenir au moins 2 caractères'),
  pays: z.string().min(2, 'Le pays doit contenir au moins 2 caractères'),
  adresse: z.string().min(5, 'L\'adresse doit contenir au moins 5 caractères'),
  liens: z.object({
    github: z.string().url('L\'URL GitHub n\'est pas valide').optional().or(z.literal('')),
    linkedin: z.string().url('L\'URL LinkedIn n\'est pas valide').optional().or(z.literal('')),
    portfolio: z.string().url('L\'URL du portfolio n\'est pas valide').optional().or(z.literal('')),
  }),
  formation: z.array(z.object({
    titre: z.string().min(2, 'Le titre doit contenir au moins 2 caractères'),
    etablissement: z.string().min(2, 'L\'établissement doit contenir au moins 2 caractères'),
    ville: z.string().min(2, 'La ville doit contenir au moins 2 caractères'),
    pays: z.string().min(2, 'Le pays doit contenir au moins 2 caractères'),
    dateDebut: z.string(),
    dateFin: z.string().optional(),
  })),
});

interface ChercheurFormProps {
  onSubmit: (data: ProfilChercheur, files?: { [key: string]: File }) => Promise<void>;
  initialData?: ProfilChercheur;
}

export function ChercheurForm({ onSubmit, initialData }: ChercheurFormProps) {
  const { uploadFile, isUploading } = useStorage();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cvPreview, setCvPreview] = useState<string | null>(initialData?.cv || null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photoProfil || null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      telephone: initialData?.telephone || '',
      ville: initialData?.ville || '',
      pays: initialData?.pays || '',
      adresse: initialData?.adresse || '',
      liens: {
        github: initialData?.liens?.github || '',
        linkedin: initialData?.liens?.linkedin || '',
        portfolio: initialData?.liens?.portfolio || '',
      },
      formation: initialData?.formation || [],
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cv' | 'photo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'cv' && !file.type.includes('pdf')) {
      form.setError('cv', { message: 'Le fichier doit être au format PDF' });
      return;
    }

    if (type === 'photo' && !file.type.startsWith('image/')) {
      form.setError('photo', { message: 'Le fichier doit être une image' });
      return;
    }

    if (type === 'cv') {
      setCvFile(file);
      setCvPreview(URL.createObjectURL(file));
    } else {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    const files: { [key: string]: File } = {};
    if (cvFile) files.cv = cvFile;
    if (photoFile) files.photo = photoFile;

    await onSubmit(data, files);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de téléphone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+33 6 12 34 56 78" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ville"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="pays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adresse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse complète</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Liens professionnels (optionnels)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="liens.github"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://github.com/..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="liens.linkedin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://linkedin.com/in/..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="liens.portfolio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portfolio</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Formation</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const formation = form.getValues('formation');
                      formation.push({
                        titre: '',
                        etablissement: '',
                        ville: '',
                        pays: '',
                        dateDebut: '',
                      });
                      form.setValue('formation', formation);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une formation
                  </Button>
                </div>

                <AnimatePresence>
                  {form.watch('formation').map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 p-4 border rounded-lg"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Formation {index + 1}</h4>
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const formation = form.getValues('formation');
                              formation.splice(index, 1);
                              form.setValue('formation', formation);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`formation.${index}.titre`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Titre</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`formation.${index}.etablissement`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Établissement</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`formation.${index}.ville`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ville</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`formation.${index}.pays`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pays</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`formation.${index}.dateDebut`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date de début</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        'w-full pl-3 text-left font-normal',
                                        !field.value && 'text-muted-foreground'
                                      )}
                                    >
                                      {field.value ? (
                                        format(new Date(field.value), 'PPP', { locale: fr })
                                      ) : (
                                        <span>Sélectionner une date</span>
                                      )}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date?.toISOString())}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`formation.${index}.dateFin`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date de fin (optionnelle)</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        'w-full pl-3 text-left font-normal',
                                        !field.value && 'text-muted-foreground'
                                      )}
                                    >
                                      {field.value ? (
                                        format(new Date(field.value), 'PPP', { locale: fr })
                                      ) : (
                                        <span>Sélectionner une date</span>
                                      )}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date?.toISOString())}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormLabel>CV (PDF)</FormLabel>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(e, 'cv')}
                        className="flex-1"
                      />
                      {cvPreview && (
                        <a
                          href={cvPreview}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Voir le CV
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormLabel>Photo de profil</FormLabel>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'photo')}
                        className="flex-1"
                      />
                      {photoPreview && (
                        <img
                          src={photoPreview}
                          alt="Photo de profil"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Button type="submit" className="w-full" disabled={isUploading}>
            {isUploading ? 'Envoi en cours...' : 'Enregistrer'}
          </Button>
        </motion.div>
      </form>
    </Form>
  );
} 