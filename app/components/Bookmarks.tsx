import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { BookmarksProps, Link } from "../types"
import { TableBody, Table, TableRow, TableCell, Modal, Button, BottomNavigation } from '@mui/material';


const Bookmarks = ({category, bookmarks, handleRemove, setUpdate}: BookmarksProps) => {
    
    const row = (index: number, link: Link, category: string) => {

        const tooltip = "Link {\n\n   NAME: " + link.name + ",\n\n   URL: " + link.url + "\n\n}"
        return <TableRow key={index}>
                <TableCell style={{width: "12px"}}  onClick={() => setUpdate({editing: {
                        url: link.url,
                        category,
                        index,
                        name: link.name
                    }})}
                    title={"Edit the link " + tooltip}>
                    <EditIcon color="success"/>
                
                </TableCell>
                <TableCell style={{width: "12px"}} title={"Remove the link " + tooltip} >
                    <DeleteIcon  onClick={() => {
                        window.confirm("\nDo you really want to remove "
                             + "\n"
                             + "\n - Category: " + category
                             + "\n - Name: " + link.name
                             + "\n - URL: " + link.url
                             + "\n"
                             + "\nfrom your bookmarks?"
                             + "\n"
                        ) && handleRemove(category, index)
                        
                    }}
                    color="error"/>
                </TableCell>
                <TableCell style={{width: "12px"}}>
                <img
                    src={`https://www.google.com/s2/favicons?sz=32&domain_url=${link.url}`}
                    alt={`Favicon for ${link.url}`}
                    title={tooltip}
                    width={25}
                
                
                />
                </TableCell>
                <TableCell onClick={(event) => {
                        event.stopPropagation()
                        event.preventDefault()
                        window.open(link.url, "_blank")
                    }}
                    title={tooltip}
                    >{link.url}
                </TableCell>
        </TableRow>
    }

    const boxes: JSX.Element[] = []

    const folders: JSX.Element[] = []

    Object.keys(bookmarks||[]).forEach((cat, i) => {
        folders.push(<Button key={i} color={"secondary"} variant="contained" onClick={(event) => {
            event.stopPropagation()
            event.preventDefault()
            if (cat === category)
                setUpdate({
                    category: undefined
                })
            else 
                setUpdate({category: cat})
        }}>{cat}</Button>)
    })

    Object.keys(bookmarks||[]).filter(cat => cat === category).forEach((category, i) => {
            bookmarks[category].forEach((link, j) => {
                boxes.push(row(j, link, category))
            })
    })

    
    
    return <>
            <Modal
                open={category !== undefined}
            >            
                <><Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={4}>
                Browsing bookmarks in the {category} folder.
              </TableCell>
            </TableRow>
            {boxes}
          </TableBody>
                </Table>
                <BottomNavigation ><Button 
                        variant="contained" 
                        color="secondary" 
                        onClick={() => setUpdate({category: undefined})}
                    >Close</Button><Button variant="contained" color="secondary" onClick={() => setUpdate({editing: {
                index: -1,
                name: "",
                url: "",
                category: category
            }, folderOnly: false})} >Add</Button>
                <Button variant="contained" color="error" onClick={() => {
                    if (category !== undefined)
                        if (window.confirm("Are you sure you want to delete the complete folder?")) {
                            handleRemove(category, -1)
                        }
                }} >Remove</Button>
            </BottomNavigation >
                </>
            </Modal>
            
            
        {...folders}
    </>
}

export default Bookmarks;