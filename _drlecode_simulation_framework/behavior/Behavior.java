package behavior;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Random;
import java.util.concurrent.ThreadLocalRandom;

import Action.Action;
import Action.NeighborReference;
import Action.SelfReference;
import Action.SpaceReference_Expand;
import Action.SpaceReference_Static;
import Activation.Activation;
import Activation_getCheckingValue.NeighborChecking_Value;
import Activation_getCheckingValue.SpaceChecking_Value;
import Utility.GlobalVariable;
import Utility.ReturnVar;
import Utility.myUtility;
import activation_function.Activation_function;
import activation_function.Activation_function_binary;
import activation_function.Activation_function_linear;
import agents.Agent;
import agents.Position;
import agents.Property_numeric;
import core.Main;
import entities.Entity;
import filters.Filter;
import filters.Filter_method;
import filters.Filter_ranged;

public class Behavior 
{
	public String ID = "";
	//Run model	
	public Activation activation = new Activation();
	
	public Action action = new Action();
	
	public double weight;
	
	public boolean mutate = true;
		
	public boolean simplify_check = false;
	
	//Testing the new FOV_zone for now
	
	public BehaviorTemplate B_template= new BehaviorTemplate();
	
	//Dummy constructor
	public Behavior()
	{

	}
		
	//Create a behavior with template here

	public Behavior(BehaviorTemplate b_temp, double property_p)
	{
		if (property_p == 0)
		{
			System.out.println();
		}
		
		this.B_template = b_temp;
		
		this.ID = b_temp.ID;;
		
		Random rand;
		rand = new Random();  

		//Create a random activation
		//Argument in this activation constructor is meaningless
		this.activation = new Activation(B_template);
		
		//Activation and Action are related to each other
		//So it is needed to resitrict option for both of them
		//So that we do not have confusing behavior.
		//For example: Agents see the nearest agent is moving slowly, decide to avoid the obstacles nearby
		
		/*
		//Activation for speed up behavior is fixed
		if (property_p == 3.0)
		{
			this.activation = new Activation(2, 0,120, new Activation_function());
			
			this.activation.activation_function = new Activation_function_linear(10, true);
		}
		*/
		
		
		
		//0: get reference value from self
				
		//If activation is always active or self 
		//Action can have any option
		if (this.activation.option == 0 || this.activation.option == 1)
		{
			//Get the option for behavior
			//0: get reference value from self
			//1: get reference value from neighbor
			//2: get reference value from space
			//Speed property for now does not have space behavior
			if (property_p == 3.0)
			{
				do
				{
					this.action.type = Main.searchSpace.action_option.get(rand.nextInt(Main.searchSpace.action_option.size()));
				}while (this.action.type == 2);
			}
			else
			{
				this.action.type = Main.searchSpace.action_option.get(rand.nextInt(Main.searchSpace.action_option.size()));
			}
		}
		//If activation option is neighbor checking
		//Action can be getting reference value from self or neighbor of the same entity
		else if (this.activation.option == 2)
		{
			
			//Choose an action option that is not space behavior
			if (property_p == 3.0)
			{
				do
				{
					this.action.type  = Main.searchSpace.action_option.get(rand.nextInt(Main.searchSpace.action_option.size()));
				}while (this.action.type == 2);
			}
			else
			{
				//do
				{
					this.action.type  = Main.searchSpace.action_option.get(rand.nextInt(Main.searchSpace.action_option.size()));
				}//while (this.action.type == 2);
			}
			

			
		}
		//If activation option is space checking
		//Action can begetting reference value from self or space of the same heading option
		else if (this.activation.option == 3)
		{
			//if behavior property is speed
			//and activation option is checking space
			//the only option for action is self check
			if (property_p == 3.0)
			{
				this.action.type = 0;
				//System.out.println("It checked here");
			}
			else
			{
				//Choose an action option that is not neighbor checking behavior
				do
				{
					this.action.type  = Main.searchSpace.action_option.get(rand.nextInt(Main.searchSpace.action_option.size()));
				}while (this.action.type == 1);
			}
			
		}
		
		//0: get reference from self

		if (this.action.type == 0)
		{
			//If behavior already check self reference
			//It does not make sense to always activate it
			//Will create spinning effect
			while (this.activation.option == 0)
			{
				this.activation = new Activation(B_template);
			}
			
			this.action = new SelfReference(property_p);
		}
		//1: get reference value from neighbor
		else if (this.action.type  == 1)
		{	
			this.action = new NeighborReference(property_p);
			//Meaning both activation and option are using neighbor entity
			//Both must act on the same entity 
			//But can used different property value
			if (this.activation.option == 2)
			{
				NeighborReference action_temp = (NeighborReference) this.action;
				action_temp.filter_chain.clear();
				NeighborChecking_Value filter_from_activation = (NeighborChecking_Value) this.activation.checking_value_reference;
				//For now, filter from both activation and action need to be the same
				//To guarantee they will act on the same entity in one specific timestep
				//As a result, to make it easier when mutate -> shadow copy is good enough here
				//So that when filter chain of one component is mutated, the other will also be changed.
				action_temp.filter_chain = filter_from_activation.filter_chain;

			}
			
			//It is ok now
			if (this.activation.option == 3)
			{
				//System.out.println("Activation option is neighbor and action is space");
			}
		}
		//2: self - space
		else if (this.action.type  == 2)
		{
			//For space behavior, it always extract angle
			//this.action = new SpaceReference_Expand(property_p);
			
			this.action = new SpaceReference_Static(property_p);
			
			//Meaning both activation and action are act on heading entity for space
			//They need to be the same in term of component specification
			if (this.activation.option == 3)
			{
				
				SpaceChecking_Value activation_temp = (SpaceChecking_Value) this.activation.checking_value_reference;
				
				//SpaceReference_Expand action_temp = (SpaceReference_Expand) activation_temp.action_for_activation;
				
				//SpaceReference_Static action_temp = (SpaceReference_Static) activation_temp.action_for_activation;
				SpaceReference_Static action_temp = (SpaceReference_Static) activation_temp.action_for_activation_static;
				//this.action = new SpaceReference_Expand(0,action_temp.filter_chain,action_temp.act_on_empty_space, 
						//action_temp.act_on_space_property, action_temp.heading_option_combination, action_temp.extract_property);
				
				this.action = new SpaceReference_Static(0,action_temp.filter_chain,action_temp.act_on_empty_space, 
						action_temp.act_on_space_property, action_temp.heading_option_combination, action_temp.extract_property);
			
			}
			
			if (this.activation.option == 2)
			{
				//System.out.println("Activation option is space and action is neighbor");
			}
		}
		
		if (property_p == 3.0 && this.action.type == 2)
		{
			System.out.println("Speed behavior should not work with space property");
		}
		
		//Offset must be negative
		if (B_template.offset_option < 0)
		{
			do 
			{
				ArrayList<Double> offset_list = Main.searchSpace.getOffsetList(B_template.extract_property);
				
				action.offset = offset_list.get(rand.nextInt(offset_list.size()));
			}
			while (action.offset >= 0);
		}
		//Offset must be positive
		else if (B_template.offset_option > 0)
		{
			do 
			{
				ArrayList<Double> offset_list = Main.searchSpace.getOffsetList(B_template.extract_property);
				
				action.offset = offset_list.get(rand.nextInt(offset_list.size()));
			}
			while (action.offset <= 0);
		}
		//Offset = 0;
		else
		{
			action.offset = 0;
		}
		
	}
	
	//Create random behavior here
	public Behavior(double extract_p)
	{
		
		Random rand;
		rand = new Random();  

		//Create a random activation
		//Argument in this activation constructor is meaningless
		this.activation = new Activation(B_template);
				
		//Speed property for now does not have space behavior
		if (extract_p == 3.0)
		{
			
			do
			{
				this.action.type  = Main.searchSpace.action_option.get(rand.nextInt(Main.searchSpace.action_option.size()));
			}
			while(this.action.type  == 2);
			
		}
		else
		{
			this.action.type  = Main.searchSpace.action_option.get(rand.nextInt(Main.searchSpace.action_option.size()));
			//this.option = 2;
		}
						
		//Meaning that agent already check neighbor condition in activation step
		//Action step does not need to check neighbor again
		//So it is always self check condition
		if (this.activation.option == 2)
		{
			if (extract_p == 3.0)
			{
				this.action.type  = 1;
			}
			else
			{
				while (this.action.type  == 1)
				{
					this.action.type  = Main.searchSpace.action_option.get(rand.nextInt(Main.searchSpace.action_option.size()));
				}
			}
			
		}
		
		
		//Get the option for behavior
		//0: get reference value from self
		//1: get reference value from neighbor
		//2: get reference value from space
		
		//0: get reference from self
		if (this.action.type  == 0)
		{
			action = new SelfReference(extract_p);
		}
		//1: get reference value from neighbor
		else if (this.action.type  == 1)
		{
			action = new NeighborReference(extract_p);
		}
		//2: self - space
		else if (this.action.type  == 2)
		{	
			//action = new SpaceReference_Expand(extract_p);	
			action = new SpaceReference_Static(extract_p);	
		}
				
	}
	
	public Behavior (Activation activation, Action action)
	{
		this.activation = activation;
		this.action = action;
	}
	
	
	
	
}
 