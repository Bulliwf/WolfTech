import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { API, Storage, Auth } from "aws-amplify";
import {Button, Flex, Heading, Image, Text, TextField, View, withAuthenticator} from "@aws-amplify/ui-react";
import { listNotes } from "./graphql/queries";
import {createNote as createNoteMutation, deleteNote as deleteNoteMutation} from "./graphql/mutations";

const initialFormState = { name: '', description: ''}

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  useEffect(() => {
    fetchNotes();
  }, []);
    
    const App = ({signOut}) => {
        const [notes, setNotes] = useState([]);
        useEffect(() => {
        fetchNotes();
      }, []);

}

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async (note) => {
        if (note.image) {
          const url = await Storage.get(note.name);
          note.image = url;
        }
        return note;
      })
    );
    setNotes(notesFromAPI);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }


  async function deleteNote({ id }) {
    const newNotes = notes.filter((note) => note.id !== id);
    setNotes(newNotes);
    await Storage.remove(notes.name);
    await Storage.remove(notes.name);
    await API.graphql({query: deleteNoteMutation, variables: { input: { id }}});
  }
  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  return (
    <div className="App">
      
      <h1 className="bannerText">WolfTech Planner</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Note Name"
        value={formData.name}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Description"
        value={formData.description}
      />
      <input
      type="file"
      onChange={onChange}/>
      <button onClick={createNote}>Create Note</button>
      <div style={{marginBottom: 50}}>
        {
          notes.map(note => (
            <div key={note.id || note.name}>
              <p>_______________________________________________________________<br/></p>
              <h2 id="noteName">{note.name}</h2>
              <p>{note.description}</p>
              {
                note.image && <img class="imagePlacement" src={note.image} style={{width: 600}} alt=""/>
              }
              <div/>
              <button onClick={() => deleteNote(note)}>Delete note</button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export default withAuthenticator(App);