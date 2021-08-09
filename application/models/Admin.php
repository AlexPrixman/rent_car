<?php
class Admin extends CI_Model{
 
    public function validate(){
   
        $username = $this->input->post('username');
        $password = md5($this->input->post('password'));
        $this->form_validation->set_rules('username','Usuario','required');
        $this->form_validation->set_rules('password','Clave','required');
        
        if($this->form_validation->run() != false){
            $data = array(
            'username' => $username,
            'password' => $password
            );
        } 
        return $this->db->get_where('admin', $data)->row();
    }
}