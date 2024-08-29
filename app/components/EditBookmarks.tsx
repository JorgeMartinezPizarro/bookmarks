'use client'

import { useState } from 'react'

import { EditBookmarksProps } from '../types';
import { Autocomplete, TableBody, Table, TableRow, TableCell, TextField, Modal, Button, BottomNavigation } from '@mui/material';


const EditBookmarks = ({folderOnly, bookmark, onClose, setUpdate, handleAdd, handleEdit, handleRemove}: EditBookmarksProps) => {

    const {index, category, name, url} = bookmark

    let text = "Edit a bookmark in folder " + category

    if (folderOnly)
      text = "Create a folder for your bookmarks!"
    else if (index === -1)
      text = "Create a new bookmark in folder " + category
    
    return <Modal open={true}>
      <>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={2}>
                {text}
              </TableCell>
            </TableRow>
            {folderOnly && <TableRow>
              <TableCell>
                Folder
              </TableCell>
              <TableCell>
                <Autocomplete
                    value={category}
                    renderInput={(params) => <TextField 
                      {...params} 
                      onChange={e => setUpdate({
                        editing: {
                          ...bookmark,
                          category: e.target.value
                        }
                      })}
                      label="Enter folder name" />}
                      options={["main", "read", "work", 'news']}
                  />
                  
              </TableCell>
            </TableRow>}
            {!folderOnly && <TableRow>
              <TableCell>
                URL
              </TableCell>
            <TableCell>
              <TextField
                  placeholder="Enter URL" value={url} onChange={e => setUpdate({
                    editing: {
                      ...bookmark,
                      url: e.target.value
                    },
                  })}
                  
                  
                />
              </TableCell>
            </TableRow>}
            {!folderOnly && <TableRow>
              <TableCell>
                Name
              </TableCell>
            <TableCell>
              <TextField
                  placeholder="Enter name" value={name} onChange={e => setUpdate({editing: {
                  ...bookmark,
                  name: e.target.value
              }})}/>
            </TableCell>
          </TableRow>}
        </TableBody>
      </Table>
      <BottomNavigation> 
        <Button color="secondary" onClick={() => onClose()} variant="contained">Close</Button>
        <Button color="primary" variant="contained" onClick={() => {
          
          const handleSave = () => {
              if (index === -1 && category && name && url)
                handleAdd({url: url, name: name, pos: 0}, category) 
              else if (index !== -1 && url && category)
                handleEdit({url: url, name: name, pos: 0}, category, index)
              else if (folderOnly && category) 
                handleAdd({url: "", name: "", pos: -1}, category)
              else 
                alert("No way to save an empty bookmark!")
          }

          window.confirm("\nDo you really want to save the following link\n\n - url: " + url + " \n - name: " + name + "\n - category: " + category) &&
            handleSave()            
        }}>
          Save
        </Button>
      </BottomNavigation>
    </>
    </Modal>
}

export default EditBookmarks;