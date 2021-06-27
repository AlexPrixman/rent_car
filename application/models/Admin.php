<?php
class Admin extends CI_Model{
 
    public function validate(){
   
        $username = $this->input->post('username');
        $password = md5($this->input->post('password'));
        
        if($this->form_validation->run() != false){
            $data = array(
            'username' => $username,
            'password' => $password
            );
        } 
        return $this->db->get_where('admin', $data)->row();
    }
}