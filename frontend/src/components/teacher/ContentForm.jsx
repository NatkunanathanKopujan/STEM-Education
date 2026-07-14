import { useForm } from 'react-hook-form';
import { Button, SecondaryButton } from '../ui/Button';
import { FileUpload } from '../ui/FileUpload';
import { DatePicker, SelectBox, Textarea } from '../ui/FormControls';
import { Input } from '../ui/Input';

export function ContentForm({ type, onSubmit, onCancel }) {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      curriculum: 'Computer Science',
      subject: 'Web Development',
      status: 'Draft',
      visibility: 'Entire Class',
      target: 'Entire Class',
    },
  });

  if (type === 'note') {
    return (
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Title" {...register('title', { required: true })} />
        <Input label="Topic" {...register('topic', { required: true })} />
        <Textarea label="Rich Text Notes" placeholder="Use this area for bold, italic, tables, lists, images, and code block content." {...register('content')} />
        <SelectBox label="Status" options={[{ label: 'Draft', value: 'Draft' }, { label: 'Published', value: 'Published' }]} {...register('status')} />
        <div className="flex justify-end gap-3"><SecondaryButton onClick={onCancel}>Cancel</SecondaryButton><Button type="submit">Save Note</Button></div>
      </form>
    );
  }

  if (type === 'announcement') {
    return (
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Title" {...register('title', { required: true })} />
        <SelectBox label="Target" options={[{ label: 'Entire Class', value: 'Entire Class' }, { label: 'Specific Curriculum', value: 'Specific Curriculum' }, { label: 'Specific Batch', value: 'Specific Batch' }]} {...register('target')} />
        <Textarea label="Message" className="md:col-span-2" {...register('message', { required: true })} />
        <DatePicker label="Publish Date" {...register('publishDate')} />
        <FileUpload label="Attachment (Optional)" />
        <div className="flex justify-end gap-3 md:col-span-2"><SecondaryButton onClick={onCancel}>Cancel</SecondaryButton><Button type="submit">Publish Announcement</Button></div>
      </form>
    );
  }

  if (type === 'video') {
    return (
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Title" {...register('title', { required: true })} />
        <SelectBox label="Video Type" options={[{ label: 'MP4', value: 'MP4' }, { label: 'YouTube Link', value: 'YouTube' }, { label: 'Vimeo Link', value: 'Vimeo' }, { label: 'Recorded Lecture', value: 'Recorded Lecture' }]} {...register('type')} />
        <Input label="Week Number" type="number" {...register('week')} />
        <Input label="Topic" {...register('topic')} />
        <Input label="Duration" {...register('duration')} />
        <FileUpload label="Thumbnail" accept="image/*" />
        <Textarea label="Description" className="md:col-span-2" {...register('description')} />
        <FileUpload label="Video Upload" helperText="MP4 or external video link metadata" accept="video/mp4" />
        <div className="flex justify-end gap-3 md:col-span-2"><SecondaryButton onClick={onCancel}>Cancel</SecondaryButton><Button type="submit">Save Video</Button></div>
      </form>
    );
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <Input label="Title" {...register('title', { required: true })} />
      <SelectBox label="Material Type" options={['PDF', 'PPT', 'PPTX', 'DOC', 'DOCX', 'ZIP', 'Image'].map((value) => ({ label: value, value }))} {...register('type')} />
      <SelectBox label="Curriculum" options={[{ label: 'Computer Science', value: 'Computer Science' }, { label: 'Data Science', value: 'Data Science' }]} {...register('curriculum')} />
      <Input label="Subject" {...register('subject')} />
      <Input label="Week Number" type="number" {...register('week')} />
      <Input label="Topic Name" {...register('topic')} />
      <Textarea label="Description" className="md:col-span-2" {...register('description')} />
      <SelectBox label="Status" options={[{ label: 'Draft', value: 'Draft' }, { label: 'Published', value: 'Published' }]} {...register('status')} />
      <DatePicker label="Publish Date" {...register('publishDate')} />
      <SelectBox label="Visibility" options={[{ label: 'Entire Class', value: 'Entire Class' }, { label: 'Specific Batch', value: 'Specific Batch' }]} {...register('visibility')} />
      <FileUpload label="File Upload" helperText="PDF, PPT, PPTX, DOC, DOCX, ZIP, or images" />
      <div className="flex justify-end gap-3 md:col-span-2"><SecondaryButton onClick={onCancel}>Cancel</SecondaryButton><Button type="submit">Save Material</Button></div>
    </form>
  );
}
