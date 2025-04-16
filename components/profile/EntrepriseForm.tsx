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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfilEntreprise } from '@/types/profile';
import { useStorage } from '@/hooks/use-storage';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  typeEntreprise: z.enum(['startup', 'grand groupe', 'multinationale', 'internationale']),
  ville: z.string().min(2, 'La ville doit contenir au moins 2 caractères'),
  pays: z.string().min(2, 'Le pays doit contenir au moins 2 caractères'),
  dateFondation: z.string(),
  nombreEmployes: z.number().min(1, 'Le nombre d\'employés doit être supérieur à 0'),
  nombreRecrutementsAnnee: z.number().min(0, 'Le nombre de recrutements ne peut pas être négatif'),
  description: z.string().min(50, 'La description doit contenir au moins 50 caractères'),
  contactRH: z.object({
    email: z.string().email('L\'email n\'est pas valide'),
    telephone: z.string().min(10, 'Le numéro de téléphone doit contenir au moins 10 caractères'),
  }),
  siteWeb: z.string().url('L\'URL du site web n\'est pas valide').optional().or(z.literal('')),
  linkedin: z.string().url('L\'URL LinkedIn n\'est pas valide').optional().or(z.literal('')),
  filiales: z.array(z.object({
    nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    ville: z.string().min(2, 'La ville doit contenir au moins 2 caractères'),
    pays: z.string().min(2, 'Le pays doit contenir au moins 2 caractères'),
  })),
});

interface EntrepriseFormProps {
  onSubmit: (data: ProfilEntreprise, files?: { [key: string]: File }) => Promise<void>;
  initialData?: ProfilEntreprise;
}

export function EntrepriseForm({ onSubmit, initialData }: EntrepriseFormProps) {
  const { uploadFile, isUploading } = useStorage();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: initialData?.nom || '',
      typeEntreprise: initialData?.typeEntreprise || 'startup',
      ville: initialData?.ville || '',
      pays: initialData?.pays || '',
      dateFondation: initialData?.dateFondation || '',
      nombreEmployes: initialData?.nombreEmployes || 0,
      nombreRecrutementsAnnee: initialData?.nombreRecrutementsAnnee || 0,
      description: initialData?.description || '',
      contactRH: {
        email: initialData?.contactRH?.email || '',
        telephone: initialData?.contactRH?.telephone || '',
      },
      siteWeb: initialData?.siteWeb || '',
      linkedin: initialData?.linkedin || '',
      filiales: initialData?.filiales || [],
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      form.setError('logo', { message: 'Le fichier doit être une image' });
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    const files: { [key: string]: File } = {};
    if (logoFile) files.logo = logoFile;

    await onSubmit(data, files);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'entreprise</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="typeEntreprise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'entreprise</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="grand groupe">Grand groupe</SelectItem>
                      <SelectItem value="multinationale">Multinationale</SelectItem>
                      <SelectItem value="internationale">Internationale</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            <FormField
              control={form.control}
              name="dateFondation"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de fondation</FormLabel>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombreEmployes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre d'employés</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nombreRecrutementsAnnee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recrutements par an</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description de l'entreprise</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[150px]"
                      placeholder="Décrivez votre entreprise, sa mission, ses valeurs..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact RH</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="contactRH.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email RH</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactRH.telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone RH</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="siteWeb"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site web</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://www.example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://linkedin.com/company/..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filiales</CardTitle>
          </CardHeader>
          <CardContent>
            {form.watch('filiales').map((_, index) => (
              <div key={index} className="space-y-4 mb-6 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Filiale {index + 1}</h3>
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const filiales = form.getValues('filiales');
                        filiales.splice(index, 1);
                        form.setValue('filiales', filiales);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FormField
                  control={form.control}
                  name={`filiales.${index}.nom`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`filiales.${index}.ville`}
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
                    name={`filiales.${index}.pays`}
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
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const filiales = form.getValues('filiales');
                filiales.push({
                  nom: '',
                  ville: '',
                  pays: '',
                });
                form.setValue('filiales', filiales);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une filiale
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <FormLabel>Logo de l'entreprise</FormLabel>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {logoPreview && (
                <div className="mt-2">
                  <img
                    src={logoPreview}
                    alt="Logo de l'entreprise"
                    className="w-32 h-32 object-contain"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isUploading}>
          {isUploading ? 'Envoi en cours...' : 'Enregistrer'}
        </Button>
      </form>
    </Form>
  );
} 