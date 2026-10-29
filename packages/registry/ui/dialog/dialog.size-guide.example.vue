<script setup lang="ts">
import { Button } from '@library/components/ui/button'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@library/components/ui/item'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@library/components/ui/table'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
  DialogTrigger,
} from '.'

defineOptions({ inheritAttrs: false })

const sizes = [
  { size: 'XS', chest: '82–86', waist: '66–70', sleeve: 60 },
  { size: 'S', chest: '87–92', waist: '71–76', sleeve: 61 },
  { size: 'M', chest: '93–100', waist: '77–84', sleeve: 62 },
  { size: 'L', chest: '101–108', waist: '85–92', sleeve: 63 },
  { size: 'XL', chest: '109–116', waist: '93–100', sleeve: 64 },
  { size: 'XXL', chest: '117–124', waist: '101–108', sleeve: 65 },
]

const notes = [
  {
    term: 'Chest',
    detail: 'Under your arms, around the fullest part, tape level at the back.',
  },
  {
    term: 'Waist',
    detail: 'Around the narrowest part of your torso, snug but not tight.',
  },
  {
    term: 'Sleeve',
    detail: 'From the back of your neck, over the shoulder, down to the wrist.',
  },
]
</script>

<template>
  <Dialog default-open v-bind="$attrs">
    <DialogTrigger as-child
      ><Button variant="outline" color="neutral"
        >Size guide</Button
      ></DialogTrigger
    >
    <DialogScrollContent>
      <DialogHeader>
        <DialogTitle>Size guide</DialogTitle>
        <DialogDescription
          >Jackets fit true to size. Between two sizes, take the larger one to
          wear a fleece underneath.</DialogDescription
        >
      </DialogHeader>
      <Table>
        <TableCaption>Body measurements in centimetres.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Size</TableHead>
            <TableHead class="text-end">Chest</TableHead>
            <TableHead class="text-end">Waist</TableHead>
            <TableHead class="text-end">Sleeve</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in sizes" :key="row.size">
            <TableCell>{{ row.size }}</TableCell>
            <TableCell class="text-end">{{ row.chest }}</TableCell>
            <TableCell class="text-end">{{ row.waist }}</TableCell>
            <TableCell class="text-end">{{ row.sleeve }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <ItemGroup aria-label="How to measure">
        <Item v-for="note in notes" :key="note.term" size="sm">
          <ItemContent>
            <ItemTitle>{{ note.term }}</ItemTitle>
            <ItemDescription>{{ note.detail }}</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
      <DialogFooter>
        <DialogClose as-child><Button>Got it</Button></DialogClose>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
