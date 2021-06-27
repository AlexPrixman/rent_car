<?php
class Register extends CI_Controller{

    function index(){
        $this->load->view('admin/register');
    }

    function register_user(){
        $this->load->view('header');
        $this->load->view('admin/register');
        $this->load->view('footer');
    }
    //Over here we admin the cars
    function register_user_act(){
        $name         = $this->input->post('name');
        $username     = $this->input->post('username');
        $password     = md5($this->input->post('password'));
       
        $this->form_validation->set_rules('name','Name','required');
        $this->form_validation->set_rules('username','User Name','required');
        $this->form_validation->set_rules('password','Password','required');
        
        if($this->form_validation->run() != false){
            $data = array(
                'name'          => $name,
                'username'      => $username,
                'password'      => $password
            );
            $this->m_rental->insert_data($data, 'admin');
            redirect(base_url().'admin');
        } else { 
            $this->load->view('header');
            $this->load->view('admin/register');
            $this->load->view('footer');
        } 
    }

}